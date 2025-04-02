import os
import json
import logging
from typing import Dict, List, Any, Optional
import asyncio
import re
from urllib.parse import urlparse
from dataclasses import dataclass
from datetime import datetime

# Fix imports to use langchain_community instead of deprecated paths
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.chat_models import ChatGroq
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import tool
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.schema import SystemMessage, HumanMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.tools.retriever import create_retriever_tool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pendo_agent")

# Define ACT member companies and career URLs
ACT_MEMBERS_DATA = [
    {
        "name": "Abode Energy Management",
        "overview": "Energy efficiency and carbon reduction consulting, energy management services for utilities, contractors, and homeowners, including in-person and remote business models.",
        "website": "https://www.abodeem.com",
        "careers_url": "https://www.linkedin.com/jobs/view/decarbonization-specialist-at-abode-energy-management-3895632336",
        "linkedin": "https://www.linkedin.com/company/abode-energy-management/",
        "industry": "Environmental Services; Energy Management",
        "subsector": "Energy efficiency; Decarbonization"
    },
    {
        "name": "Action for Boston Community Development, Inc. (ABCD)",
        "overview": "Low-income assistance programs including energy assistance (LIHEAP), weatherization program, food voucher programs, ESOL classes, and job opportunities for the community.",
        "website": "http://www.bostonabcd.org",
        "careers_url": "https://careers.bostonabcd.org/#js-careers-jobs-block",
        "linkedin": "https://www.linkedin.com/company/action-for-boston-community-development/",
        "industry": "Nonprofit Organization Management; Human Services",
        "subsector": "Community Development; Social Services"
    },
    {
        "name": "Agilitas Energy, Inc.",
        "overview": "Development, building, ownership, and operation of distributed energy storage and solar PV systems",
        "website": "https://www.agilitasenergy.com",
        "careers_url": "https://agilitasenergy.com/contact/",
        "linkedin": "https://www.linkedin.com/company/agilitas-energy-inc/",
        "industry": "Renewable Energy; Energy Storage",
        "subsector": "Solar PV Systems; Battery Energy Storage Systems"
    },
    {
        "name": "Analog Devices",
        "overview": "Analog, mixed-signal, and digital signal processing (DSP) integrated circuits (IC) development and manufacturing.",
        "website": "https://www.analog.com",
        "careers_url": "https://analogdevices.wd1.myworkdayjobs.com/External",
        "linkedin": "https://www.linkedin.com/company/analog-devices/",
        "industry": "Semiconductor Manufacturing",
        "subsector": "Analog, Mixed-Signal, and Digital Signal Processing Integrated Circuits"
    },
    {
        "name": "Franklin Cummings Tech",
        "overview": "Technical and trade education, including programs in HVAC & Refrigeration, Engineering, and Cybersecurity.",
        "website": "https://www.franklincummings.edu",
        "careers_url": "https://recruiting.paylocity.com/recruiting/jobs/All/7566732a-4240-4a20-a614-53c85b140700/Benjamin-Franklin-Cummings-Institute-of-Technology",
        "linkedin": "https://www.linkedin.com/school/franklincummingstech/",
        "industry": "Education; Technology",
        "subsector": "Technical College; STEM Education"
    },
    {
        "name": "BerryDunn",
        "overview": "BerryDunn is a full-service accounting, assurance, and consulting firm headquartered in Portland, Maine, serving clients across the United States and internationally.",
        "website": "https://www.berrydunn.com",
        "careers_url": "https://careers-berrydunn.icims.com/jobs/search?hashed=-626005938&mobile=false&width=1240&height=500&bga=true&needsRedirect=false&jan1offset=-300&jun1offset=-240",
        "linkedin": "https://www.linkedin.com/company/berrydunn/",
        "industry": "Accounting; Consulting",
        "subsector": "Tax; Advisory; Assurance"
    },
    {
        "name": "BioMed Realty",
        "overview": "BioMed Realty, a Blackstone Real Estate portfolio company, is a leading provider of real estate solutions for the life science and technology industries.",
        "website": "http://www.biomedrealty.com",
        "careers_url": "https://www.biomedrealty.com/careers#current-openings",
        "linkedin": "https://www.linkedin.com/company/biomed-realty/",
        "industry": "Real Estate",
        "subsector": "Life Science Real Estate; Technology Industries Real Estate"
    },
    {
        "name": "Clean Energy Ventures",
        "overview": "Clean Energy Ventures (CEV) is a venture capital firm that invests in early-stage companies commercializing disruptive advanced energy technologies and business model innovations.",
        "website": "https://www.cleanenergyventures.com",
        "careers_url": "https://cleanenergyventures.com/careers/",
        "linkedin": "https://www.linkedin.com/company/clean-energy-ventures/",
        "industry": "Venture Capital; Private Equity",
        "subsector": "Clean Energy; Climate Technology"
    },
    {
        "name": "CleanCapital",
        "overview": "CleanCapital is a financial technology company that accelerates investment in clean energy projects. It focuses on identifying, screening, and managing clean energy projects, enabling project owners an opportunity to exit their portfolios while providing accredited investors, including institutional investors, access to these opportunities.",
        "website": "https://cleancapital.com/",
        "careers_url": "https://cleancapital.com/careers/",
        "linkedin": "https://www.linkedin.com/company/cleancapital/",
        "industry": "Renewable Energy; Financial Services",
        "subsector": "Solar Energy; Energy Storage"
    },
    {
        "name": "Commonwealth Fusion Systems",
        "overview": "Development and commercialization of fusion energy technology.",
        "website": "https://www.cfs.energy/",
        "careers_url": "https://jobs.lever.co/cfsenergy",
        "linkedin": "https://www.linkedin.com/company/commonwealth-fusion-systems/",
        "industry": "Energy; Renewable Energy Power Generation",
        "subsector": "Nuclear Fusion Energy"
    }
]

# Extract member names for validation
ACT_MEMBERS = [company["name"] for company in ACT_MEMBERS_DATA]

# Franklin Cummings Tech programs
FRANKLIN_CUMMINGS_PROGRAMS = [
    {
        "name": "HVAC & Refrigeration Technology",
        "url": "https://franklincummings.edu/academics/academic-programs/hvacr/",
        "duration": "2 years",
        "skills_covered": ["HVAC systems", "refrigeration", "energy efficiency", "system maintenance"]
    },
    {
        "name": "Renewable Energy Technology",
        "url": "https://franklincummings.edu/academics/academic-programs/renewable-energy-technology/",
        "duration": "2 years",
        "skills_covered": ["solar PV", "wind energy", "energy storage", "system design"]
    },
    {
        "name": "Practical Electricity",
        "url": "https://franklincummings.edu/academics/academic-programs/practical-electricity/",
        "duration": "2 years",
        "skills_covered": ["electrical systems", "wiring", "electrical code", "circuit design"]
    },
    {
        "name": "Construction Management",
        "url": "https://franklincummings.edu/academics/academic-programs/construction-management/",
        "duration": "2 years",
        "skills_covered": ["green building", "project management", "sustainable construction", "building codes"]
    }
]

# MassCEC internship opportunities
MASSCEC_INTERNSHIPS = [
    {
        "name": "Clean Energy Internship Program",
        "url": "https://www.masscec.com/clean-energy-internships-students",
        "duration": "Fall, Spring, Summer sessions",
        "focus_areas": ["solar energy", "wind energy", "energy efficiency", "clean transportation"]
    },
    {
        "name": "Advancing Climate Justice Internship",
        "url": "https://www.masscec.com/advancing-climate-justice-internship",
        "duration": "Summer session",
        "focus_areas": ["environmental justice", "community outreach", "policy research"]
    }
]

class ResumeParser:
    """Parse and extract information from resumes."""
    
    def __init__(self):
        """Initialize the resume parser."""
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.2,
            max_tokens=4000
        )
    
    async def parse(self, resume_file: bytes, file_name: str) -> Dict[str, Any]:
        """Parse resume and extract structured data."""
        # Load resume file based on format
        if file_name.endswith(".pdf"):
            # Save temporary file
            temp_path = f"temp_{datetime.now().timestamp()}.pdf"
            with open(temp_path, "wb") as f:
                f.write(resume_file)
            
            # Load with PyPDFLoader
            loader = PyPDFLoader(temp_path)
            documents = loader.load()
            
            # Clean up temp file
            os.remove(temp_path)
        elif file_name.endswith(".txt"):
            # Save temporary file
            temp_path = f"temp_{datetime.now().timestamp()}.txt"
            with open(temp_path, "wb") as f:
                f.write(resume_file)
            
            # Load with TextLoader
            loader = TextLoader(temp_path)
            documents = loader.load()
            
            # Clean up temp file
            os.remove(temp_path)
        else:
            raise ValueError(f"Unsupported file format: {file_name}")
        
        # Split text into chunks
        chunks = self.text_splitter.split_documents(documents)
        
        # Extract text from all chunks
        resume_text = " ".join(chunk.page_content for chunk in chunks)
        
        # Analyze resume with LLM
        system_prompt = """
        Extract the following information from the resume:
        
        1. Personal information (name, contact details)
        2. Skills (technical, soft, domain-specific)
        3. Education (degrees, institutions, dates)
        4. Work experience (companies, roles, dates, responsibilities)
        5. Projects (names, descriptions, technologies)
        6. Certifications
        
        Focus on identifying skills and experience relevant to clean energy, sustainability, and climate tech.
        Format the output as a JSON object.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": resume_text}
        ]
        
        response = await self.llm.ainvoke(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'```json(.*?)```', response.content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = response.content
            
            parsed_data = json.loads(json_str)
            return parsed_data
        except json.JSONDecodeError:
            # If JSON parsing fails, extract structured data manually
            return self._fallback_extraction(response.content)
    
    def _fallback_extraction(self, text: str) -> Dict[str, Any]:
        """Extract structured data from text when JSON parsing fails."""
        extracted_data = {
            "personal_info": {},
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": []
        }
        
        # Extract skills using regex patterns
        skill_pattern = r"Skills:(.+?)(?:\n\n|\Z)"
        skill_match = re.search(skill_pattern, text, re.DOTALL | re.IGNORECASE)
        if skill_match:
            skills_text = skill_match.group(1)
            skills = re.findall(r"[\w\+\#][\w\s\+\#\-\.]*", skills_text)
            extracted_data["skills"] = [skill.strip() for skill in skills if skill.strip()]
        
        # Return extracted data
        return extracted_data

class JobMatcher:
    """Match candidate profiles to job opportunities."""
    
    def __init__(self):
        """Initialize the job matcher."""
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.2,
            max_tokens=4000
        )
    
    async def match_jobs(self, profile: Dict[str, Any], jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Match candidate profile to available jobs."""
        # Extract relevant profile information
        candidate_skills = profile.get("skills", [])
        candidate_experience = profile.get("experience", [])
        
        # Prepare data for LLM
        system_prompt = """
        You are an expert job matching system focusing on the Massachusetts clean energy sector.
        Your task is to match a candidate's profile with available job opportunities.
        
        For each job:
        1. Calculate a match score (0-100) based on skills and experience
        2. Identify matching skills
        3. Identify skill gaps
        4. Provide a brief explanation
        
        Focus only on clean energy and climate tech roles in Massachusetts.
        Format the output as a JSON object with 'matches' array and 'target_roles' array.
        """
        
        input_data = {
            "candidate": {
                "skills": candidate_skills,
                "experience": candidate_experience
            },
            "jobs": jobs
        }
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Match this candidate to these jobs:\n\n{json.dumps(input_data)}"}
        ]
        
        response = await self.llm.ainvoke(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'```json(.*?)```', response.content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = response.content
            
            matches = json.loads(json_str)
            
            # Extract target roles from matches
            target_roles = [match.get("title", "") for match in matches.get("matches", [])]
            matches["target_roles"] = target_roles
            
            return matches
        except (json.JSONDecodeError, AttributeError):
            # Return a basic structure if parsing fails
            return {
                "matches": [],
                "target_roles": []
            }

class SkillGapAnalyzer:
    """Analyzes skill gaps and recommends upskilling programs."""
    
    def __init__(self):
        """Initialize the skill gap analyzer."""
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.2,
            max_tokens=4000
        )
    
    async def analyze_gaps(self, profile: Dict[str, Any], target_roles: List[str]) -> Dict[str, List[str]]:
        """Analyze skill gaps between candidate profile and target roles."""
        # Extract candidate skills
        candidate_skills = profile.get("skills", [])
        
        # Prepare data for LLM
        system_prompt = """
        You are an expert career advisor specializing in the clean energy sector.
        Analyze the candidate's current skills and identify gaps for their target roles.
        
        Provide:
        1. Existing relevant skills
        2. Missing critical skills
        3. Skills to improve
        
        Focus on Massachusetts clean energy jobs.
        Format the output as a JSON object with these three categories as lists.
        """
        
        input_data = {
            "candidate_skills": candidate_skills,
            "target_roles": target_roles[:5]  # Focus on top 5 target roles
        }
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze skill gaps:\n\n{json.dumps(input_data)}"}
        ]
        
        response = await self.llm.ainvoke(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'```json(.*?)```', response.content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = response.content
            
            skill_analysis = json.loads(json_str)
            return skill_analysis
        except (json.JSONDecodeError, AttributeError):
            # Return a basic structure if parsing fails
            return {
                "existing_skills": candidate_skills,
                "missing_skills": [],
                "skills_to_improve": []
            }
    
    def _generate_recommendations(self, missing_skills: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """Generate upskilling recommendations based on missing skills."""
        recommendations = {
            "education_programs": [],
            "internship_opportunities": []
        }
        
        # Match missing skills with Franklin Cummings programs
        for program in FRANKLIN_CUMMINGS_PROGRAMS:
            program_skills = [skill.lower() for skill in program["skills_covered"]]
            
            # Check if program covers any missing skills
            matching_skills = [skill for skill in missing_skills if any(program_skill in skill.lower() or skill.lower() in program_skill for program_skill in program_skills)]
            
            if matching_skills:
                recommendations["education_programs"].append({
                    "name": program["name"],
                    "url": program["url"],
                    "duration": program["duration"],
                    "skills_covered": program["skills_covered"],
                    "matching_skills": matching_skills,
                    "source": "Franklin Cummings Tech"
                })
                
        # Recommend MassCEC internships based on missing skills
        for internship in MASSCEC_INTERNSHIPS:
            internship_focus = [area.lower() for area in internship["focus_areas"]]
            
            # Check if internship covers any missing skills
            matching_focus = [skill for skill in missing_skills if any(focus in skill.lower() or skill.lower() in focus for focus in internship_focus)]
            
            if matching_focus:
                recommendations["internship_opportunities"].append({
                    "name": internship["name"],
                    "url": internship["url"],
                    "duration": internship["duration"],
                    "focus_areas": internship["focus_areas"],
                    "matching_focus": matching_focus,
                    "source": "MassCEC"
                })
                
        return recommendations

class PendoAgent:
    """The Massachusetts Climate Economy Ecosystem Assistant."""
    
    GUARDRAILS = {
        "allowed_topics": [
            "career guidance", 
            "resume analysis",
            "skill development",
            "Massachusetts climate economy",
            "ACT member companies",
            "Franklin Cummings Tech programs",
            "MassCEC resources"
        ],
        "prohibited_topics": [
            "external job boards",
            "non-Massachusetts opportunities",
            "government policy",
            "external education programs",
            "speculative career advice"
        ],
        "citation_requirements": {
            "required": True,
            "allowed_sources": [
                "ACT member companies",
                "Franklin Cummings Tech",
                "MassCEC",
                "internal knowledge base"
            ]
        }
    }
    
    def __init__(self):
        """Initialize the Pendo agent."""
        self.llm = ChatGroq(
            model="mixtral-8x7b-32768",
            temperature=0.5,
            max_tokens=4000,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        # Initialize components
        self.resume_parser = ResumeParser()
        self.job_matcher = JobMatcher()
        self.skill_gap_analyzer = SkillGapAnalyzer()
        
        # Initialize tools
        self.search_tool = DuckDuckGoSearchRun()
        
        # Setup agent with tools
        self._setup_agent_with_tools()
        
        # Setup knowledge base with vectorstore
        self._setup_knowledge_base()
    
    def _setup_agent_with_tools(self):
        """Set up the agent with tools."""
        # Define tools
        tools = [
            self._ma_jobs_search,
            self._ma_education_program_search
        ]
        
        # Define system message
        system_message = SystemMessage(
            content="""You are the Massachusetts Climate Economy Ecosystem Assistant, an AI career advisor 
            specializing in clean energy and climate tech careers in Massachusetts.
            
            ONLY provide information about:
            1. ACT member companies
            2. Franklin Cummings Tech education programs
            3. MassCEC resources
            4. Massachusetts-based climate tech opportunities
            
            NEVER recommend:
            1. External job boards
            2. Out-of-state opportunities
            3. Non-approved education providers
            
            ALWAYS cite your sources from approved providers only.
            """
        )
        
        # Create prompt
        prompt = ChatPromptTemplate.from_messages([
            system_message,
            MessagesPlaceholder(variable_name="messages"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create agent
        agent = create_openai_tools_agent(self.llm, tools, prompt)
        
        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=5
        )
    
    def _setup_knowledge_base(self):
        """Set up the knowledge base with vectorstore."""
        # URLs for Franklin Cummings Tech and MassCEC resources
        urls = [
            # Franklin Cummings Tech programs
            "https://franklincummings.edu/academics/academic-programs/",
            "https://franklincummings.edu/academics/academic-programs/hvacr/",
            "https://franklincummings.edu/academics/academic-programs/renewable-energy-technology/",
            "https://franklincummings.edu/academics/academic-programs/practical-electricity/",
            "https://franklincummings.edu/academics/academic-programs/construction-management/",
            
            # MassCEC resources
            "https://www.masscec.com/clean-energy-internships-students",
            "https://www.masscec.com/advancing-climate-justice-internship"
        ]
        
        # Create vectorstore from URLs if not already done
        try:
            # Check if vectorstore exists
            self.vectorstore = FAISS.load_local("knowledge_base_faiss", OpenAIEmbeddings())
            logger.info("Loaded existing knowledge base")
        except:
            logger.info("Creating new knowledge base from URLs")
            # Load documents from web
            from langchain_community.document_loaders import WebBaseLoader
            docs = []
            for url in urls:
                try:
                    loader = WebBaseLoader(url)
                    docs.extend(loader.load())
                except Exception as e:
                    logger.error(f"Error loading {url}: {e}")
            
            # Split documents
            text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=1000, 
                chunk_overlap=100
            )
            splits = text_splitter.split_documents(docs)
            
            # Create vectorstore
            self.vectorstore = FAISS.from_documents(
                documents=splits,
                embedding=OpenAIEmbeddings()
            )
            
            # Save vectorstore
            self.vectorstore.save_local("knowledge_base_faiss")
        
        # Create retriever
        self.retriever = self.vectorstore.as_retriever()
        
        # Create retriever tool
        self.retriever_tool = create_retriever_tool(
            self.retriever,
            "knowledge_base_search",
            "Search for information about Massachusetts climate economy education programs and resources."
        )
    
    @tool
    def _ma_jobs_search(self, company: str) -> str:
        """
        Search for jobs at Massachusetts ACT member companies only.
        ONLY use this tool to search for jobs at approved companies in our ecosystem.
        
        Args:
            company: The ACT member company to search jobs for
            
        Returns:
            Job listings from the company's careers page
        """
        # Validate that this is an ACT member company
        if company not in ACT_MEMBERS:
            return f"Error: {company} is not an approved ACT member company. Please only search for jobs at approved companies."
            
        # Get company data
        company_data = next((c for c in ACT_MEMBERS_DATA if c["name"] == company), None)
        if not company_data:
            return f"Error: Could not find data for {company}."
            
        # Search for jobs
        query = f"site:{urlparse(company_data['careers_url']).netloc} Massachusetts clean energy job positions"
        return self.search_tool.run(query)
    
    @tool
    def _ma_education_program_search(self, skill: str) -> str:
        """
        Search for Massachusetts-based education programs at Franklin Cummings Tech.
        Use this tool ONLY to find education programs for upskilling.
        
        Args:
            skill: The skill to find education programs for
            
        Returns:
            Education programs from Franklin Cummings Tech
        """
        # Search for programs at Franklin Cummings Tech
        query = f"site:franklincummings.edu Massachusetts {skill} program training education"
        return self.search_tool.run(query)
    
    async def process_resume(self, resume_file: bytes, file_name: str) -> Dict[str, Any]:
        """Process a resume and provide comprehensive analysis with job matches and upskilling."""
        try:
            # Step 1: Parse resume
            parsed_resume = await self.resume_parser.parse(resume_file, file_name)
            logger.info(f"Resume parsed successfully: {len(parsed_resume['skills'])} skills extracted")
            
            # Step 2: Enrich profile with LinkedIn data (within guardrails)
            enriched_profile = await self._enrich_profile(parsed_resume)
            logger.info(f"Profile enriched: {len(enriched_profile['skills'])} skills identified")
            
            # Step 3: Retrieve jobs from ACT member companies
            act_jobs = await self._retrieve_act_jobs(enriched_profile)
            logger.info(f"Retrieved {len(act_jobs)} jobs from ACT member companies")
            
            # Step 4: Match profile to jobs
            job_matches = await self._match_jobs_to_profile(enriched_profile, act_jobs)
            logger.info(f"Matched {len(job_matches['matches'])} jobs to profile")
            
            # Step 5: Analyze skill gaps
            skill_analysis = await self._analyze_skill_gaps(enriched_profile, job_matches)
            logger.info(f"Identified {len(skill_analysis['missing_skills'])} skill gaps")
            
            # Step 6: Generate recommendations (education, internships)
            recommendations = await self._generate_recommendations(
                enriched_profile, 
                job_matches, 
                skill_analysis
            )
            logger.info(f"Generated {len(recommendations['education'])} education recommendations")
            
            # Step 7: Validate output against guidelines
            validated_output = self._validate_output(
                enriched_profile,
                job_matches,
                skill_analysis,
                recommendations
            )
            
            return validated_output
        
        except Exception as e:
            logger.error(f"Error processing resume: {str(e)}")
            return {
                "error": f"Failed to process resume: {str(e)}",
                "status": "error"
            }
    
    async def _enrich_profile(self, parsed_resume: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich profile with additional information from trusted sources."""
        try:
            # Clone the parsed resume
            enriched_profile = parsed_resume.copy()
            
            # Extract name and key details for searching
            name = parsed_resume.get('personal_info', {}).get('name', '')
            last_employer = None
            if parsed_resume.get('experience') and len(parsed_resume['experience']) > 0:
                last_employer = parsed_resume['experience'][0].get('company', '')
            
            if name and last_employer:
                # Search for LinkedIn profile within guardrails
                query = f"{name} {last_employer} LinkedIn Massachusetts clean energy"
                search_results = await self.agent_executor.ainvoke({
                    "messages": [
                        {"role": "user", "content": f"Search for LinkedIn profile information for {name} who worked at {last_employer}. Only return information relevant to clean energy careers in Massachusetts."}
                    ]
                })
                
                # Extract additional skills and experience from results
                additional_skills = self._extract_additional_skills(search_results["output"])
                
                # Merge with existing skills, removing duplicates
                existing_skills = set(enriched_profile.get('skills', []))
                all_skills = list(existing_skills.union(set(additional_skills)))
                enriched_profile['skills'] = all_skills
                
                # Add references to sources
                enriched_profile['sources'] = ["LinkedIn profile (Massachusetts focus)"]
            
            return enriched_profile
            
        except Exception as e:
            logger.warning(f"Profile enrichment failed: {str(e)}")
            return parsed_resume
    
    def _extract_additional_skills(self, text: str) -> List[str]:
        """Extract skills from text."""
        # Extract skills using regex
        skill_pattern = r'skill[s]?[\s:]+([^\.]+)'
        matches = re.findall(skill_pattern, text, re.IGNORECASE)
        
        skills = []
        for match in matches:
            # Split by common separators
            skill_list = re.split(r',|\s+and\s+|\s*\|\s*|\s*•\s*|\s+', match)
            for skill in skill_list:
                skill = skill.strip()
                if skill and len(skill) > 2:
                    skills.append(skill)
        
        return skills
    
    async def _retrieve_act_jobs(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Retrieve jobs from ACT member companies."""
        jobs = []
        
        # Get relevant skills for job search
        skills = profile.get('skills', [])
        
        # Identify top 5 most relevant companies based on skills
        relevant_companies = []
        for company in ACT_MEMBERS_DATA:
            skill_match_count = 0
            company_keywords = (company['industry'] + ' ' + company['subsector']).lower()
            
            for skill in skills:
                if skill.lower() in company_keywords:
                    skill_match_count += 1
            
            relevant_companies.append({
                'name': company['name'],
                'match_count': skill_match_count
            })
        
        # Sort by match count
        relevant_companies.sort(key=lambda x: x['match_count'], reverse=True)
        
        # Search for jobs at top 5 companies
        for company_data in relevant_companies[:5]:
            company = company_data['name']
            
            try:
                # Use the ma_jobs_search tool
                search_results = await self.agent_executor.ainvoke({
                    "messages": [
                        {"role": "user", "content": f"Search for clean energy jobs at {company} in Massachusetts."}
                    ]
                })
                
                # Parse job listings from search results
                jobs_from_company = self._parse_job_listings(search_results["output"], company)
                jobs.extend(jobs_from_company)
            
            except Exception as e:
                logger.error(f"Error retrieving jobs from {company}: {str(e)}")
        
        return jobs
    
    def _parse_job_listings(self, text: str, company: str) -> List[Dict[str, Any]]:
        """Parse job listings from text."""
        jobs = []
        
        # Look for job titles
        title_pattern = r'(?:^|\n)([A-Z][A-Za-z\s\-\&]+?)(?:\s+at\s+|\s*\-\s*|\s*:\s*|\s*,\s*|\s+in\s+)'
        titles = re.findall(title_pattern, text)
        
        # Look for locations
        location_pattern = r'(?:location|in|at)\s+([A-Za-z\s\-\,]+?(?:MA|Massachusetts))'
        locations = re.findall(location_pattern, text, re.IGNORECASE)
        
        # Look for URLs
        url_pattern = r'https?://[^\s)"]+'
        urls = re.findall(url_pattern, text)
        
        # Create jobs from titles
        for i, title in enumerate(titles):
            title = title.strip()
            if 5 < len(title) < 100:  # Filter out very short/long titles
                job = {
                    "title": title,
                    "company": company,
                    "location": locations[i] if i < len(locations) else "Massachusetts",
                    "url": urls[i] if i < len(urls) else "",
                    "source": "ACT member company"
                }
                jobs.append(job)
        
        # If no structured jobs found, create a general job listing
        if not jobs:
            # Get company data
            company_data = next((c for c in ACT_MEMBERS_DATA if c["name"] == company), None)
            if company_data:
                job = {
                    "title": f"Clean Energy Professional",
                    "company": company,
                    "location": "Massachusetts",
                    "url": company_data["careers_url"],
                    "source": "ACT member company"
                }
                jobs.append(job)
        
        return jobs
    
    async def _match_jobs_to_profile(self, profile: Dict[str, Any], jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Match profile to jobs."""
        return await self.job_matcher.match_jobs(profile, jobs)
    
    async def _analyze_skill_gaps(self, profile: Dict[str, Any], job_matches: Dict[str, Any]) -> Dict[str, List[str]]:
        """Analyze skill gaps between profile and target roles."""
        return await self.skill_gap_analyzer.analyze_gaps(profile, job_matches.get('target_roles', []))
    
    async def _generate_recommendations(self, profile: Dict[str, Any], job_matches: Dict[str, Any], 
                                        skill_analysis: Dict[str, List[str]]) -> Dict[str, Any]:
        """Generate recommendations for education, internships, and development plan."""
        # Get missing skills
        missing_skills = skill_analysis.get('missing_skills', [])
        
        # Recommend education programs
        education_recommendations = await self._recommend_education_programs(missing_skills)
        
        # Recommend internships
        internship_recommendations = await self._recommend_internships(
            profile, 
            job_matches.get('target_roles', [])
        )
        
        # Generate development plan
        development_plan = self._generate_development_plan(
            profile, 
            missing_skills, 
            education_recommendations
        )
        
        return {
            "education": education_recommendations,
            "internships": internship_recommendations,
            "development_plan": development_plan
        }
    
    async def _recommend_education_programs(self, missing_skills: List[str]) -> List[Dict[str, Any]]:
        """Recommend education programs for missing skills."""
        recommendations = []
        
        # For each missing skill, search for relevant Franklin Cummings programs
        for skill in missing_skills[:5]:  # Focus on top 5 missing skills
            try:
                # Use ma_education_program_search tool
                search_results = await self.agent_executor.ainvoke({
                    "messages": [
                        {"role": "user", "content": f"Search for education programs at Franklin Cummings Tech that teach {skill} skills."}
                    ]
                })
                
                # Parse education programs from search results
                programs = self._parse_education_programs(search_results["output"], skill)
                
                # Add to recommendations
                for program in programs:
                    if program not in recommendations:
                        recommendations.append(program)
            
            except Exception as e:
                logger.error(f"Error recommending programs for {skill}: {str(e)}")
        
        return recommendations
    
    def _parse_education_programs(self, search_results: str, skill: str) -> List[Dict[str, Any]]:
        """Parse education programs from search results."""
        programs = []
        
        # Look for program names and URLs
        program_pattern = r'((?:Certificate|Associate|Program|Technology
</rewritten_file>
        