#!/usr/bin/env python3
"""
Climate Economy Ecosystem Knowledge Base Ingestion
This file contains:
1. Structured URLs for ingestion into the climate economy knowledge base
2. PDF ingestion from specified resources
3. Functions to create necessary Supabase tables and indexes
"""

import os
from pathlib import Path
import json
import asyncio
import logging
import requests
from xml.etree import ElementTree
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlparse
from dotenv import load_dotenv
import httpx

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("setup_supabase.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Update the path to the PDFs
PDFS_DIR = Path("/Users/georgenekwaya/Downloads/projects_genai/climate_economy_ecosystem/temp_repo_clean/pdfs")

# Climate report resources (PDFs to be ingested - domain knowledge base for agents)
CLIMATE_DOMAIN_RESOURCES = [
    {
        "file": PDFS_DIR / "NECEC_2023_Annual_Report.pdf",
        "title": "NECEC 2023 Annual Report",
        "domain": "policy",
        "topics": ["clean_energy_economy", "massachusetts_policy", "energy_transition"]
    },
    {
        "file": PDFS_DIR / "Powering_the_Future_A_Massachusetts_Clean_Energy_Workforce_Needs_Assessment_Final.pdf",
        "title": "Powering the Future: A Massachusetts Clean Energy Workforce Needs Assessment",
        "domain": "workforce",
        "topics": ["clean_energy_jobs", "skills_gap", "workforce_development"]
    }
]

# Organized URL structure for strategic ingestion
URL_STRUCTURE = {
    # Organized by partner type for the ecosystem_partners table
    "Ecosystem Partners": {
        "Employers": [
            {
                "name": "TPS Energy",
                "partner_type": "employer",
                "website": "https://tps-energy.com/",
                "urls": [
                    "https://tps-energy.com/",
                    "https://tps-energy.com/careers/",
                    "https://tps-energy.com/projects/"
                ],
                "climate_focus": ["solar", "energy_efficiency"],
                "partnership_level": "standard"
            },
        ],
        "Education Providers": [
            {
                "name": "Franklin Cummings Tech",
                "partner_type": "education",
                "website": "https://franklincummings.edu/",
                "urls": [
                    "https://franklincummings.edu/",
                    "https://franklincummings.edu/academics/academic-programs/renewable-energy-technology/",
                    "https://franklincummings.edu/academics/academic-programs/hvacr/",
                    "https://franklincummings.edu/academics/academic-programs/building-energy-management/",
                    "https://franklincummings.edu/academics/cewp/"
                ],
                "climate_focus": ["renewable_energy", "energy_efficiency", "technical_education"],
                "partnership_level": "premium"
            }
        ],
        "Community Organizations": [
            {
                "name": "Urban League of Eastern Massachusetts",
                "partner_type": "community",
                "website": "https://www.ulem.org/",
                "urls": [
                    "https://www.ulem.org/",
                    "https://www.ulem.org/workforce-development",
                    "https://www.ulem.org/events/"
                ],
                "climate_focus": ["workforce_development", "equity"],
                "partnership_level": "standard"
            },
            {
                "name": "Headlamp",
                "partner_type": "community",
                "website": "https://myheadlamp.com/",
                "urls": [
                    "https://myheadlamp.com/",
                    "https://myheadlamp.com/career-paths/",
                    "https://myheadlamp.com/blog/"
                ],
                "climate_focus": ["career_guidance", "workforce_development"],
                "partnership_level": "standard"
            },
            {
                "name": "African Bridge Network",
                "partner_type": "community",
                "website": "https://africanbn.org/",
                "urls": [
                    "https://africanbn.org/",
                    "https://africanbn.org/programs/",
                    "https://africanbn.org/success-stories/"
                ],
                "climate_focus": ["immigrant_professionals", "workforce_integration"],
                "partnership_level": "standard"
            }
        ],
        "Government & Agencies": [
            {
                "name": "MassHire Career Centers",
                "partner_type": "government",
                "website": "https://www.mass.gov/masshire-career-centers",
                "urls": [
                    "https://www.mass.gov/masshire-career-centers"
                ],
                "climate_focus": ["workforce_development", "job_placement"],
                "partnership_level": "founding"
            },
            {
                "name": "Massachusetts Clean Energy Center",
                "partner_type": "government",
                "website": "https://www.masscec.com/",
                "urls": [
                    "https://www.masscec.com/",
                    "https://www.masscec.com/workforce-development",
                    "https://www.masscec.com/reports/industry-2023/",
                    "https://www.masscec.com/programs/equity",
                    "https://www.masscec.com/offshore-wind"
                ],
                "climate_focus": ["clean_energy", "workforce_development", "equity", "offshore_wind"],
                "partnership_level": "founding"
            }
        ],
        "Nonprofit Organizations": [
            {
                "name": "Alliance for Climate Transition (ACT)",
                "partner_type": "nonprofit",
                "website": "https://www.joinact.org/",
                "urls": [
                    "https://www.joinact.org/",
                    "https://joinact.org/our-work/community-initiatives"
                ],
                "climate_focus": ["climate_action", "community_initiatives"],
                "partnership_level": "standard"
            }
        ]
    },

    # Resource categories for organization
    "Resource Categories": {
        "Career Guidance": [
            "https://myheadlamp.com/career-paths/",
            "https://www.masscec.com/workforce-development"
        ],
        "Training Programs": [
            "https://franklincummings.edu/academics/academic-programs/renewable-energy-technology/",
            "https://franklincummings.edu/academics/academic-programs/hvacr/",
            "https://franklincummings.edu/academics/academic-programs/building-energy-management/"
        ],
        "Job Opportunities": [
            "https://tps-energy.com/careers/"
        ],
        "Community Resources": [
            "https://www.ulem.org/workforce-development",
            "https://africanbn.org/programs/"
        ],
        "Policy Information": [
            "https://www.masscec.com/programs/equity",
            "https://www.masscec.com/offshore-wind"
        ]
    },

    # Specific resources for different user types
    "Target Audience Resources": {
        "Veterans": [
            "https://myheadlamp.com/career-paths/",
            "https://www.mass.gov/masshire-career-centers",
            "https://www.masscec.com/workforce-development",
            "https://franklincummings.edu/academics/academic-programs/renewable-energy-technology/"
        ],
        "Environmental Justice Communities": [
            "https://www.ulem.org/workforce-development",
            "https://www.masscec.com/programs/equity",
            "https://joinact.org/our-work/community-initiatives"
        ],
        "International Professionals": [
            "https://africanbn.org/programs/",
            "https://africanbn.org/success-stories/",
            "https://www.mass.gov/masshire-career-centers"
        ]
    },

    # Content extraction strategy
    "Content Extraction Methods": {
        "PDF Documents": [
            "https://www.masscec.com/reports/industry-2023/"
        ],
        "JavaScript-Heavy Sites": [
            "https://myheadlamp.com/",
            "https://www.greentownlabs.com/"
        ],
        "API-Accessible Resources": [
            "https://www.mass.gov/masshire-career-centers"
        ]
    }
}

# Domain knowledge categories derived from PDFs
DOMAIN_KNOWLEDGE_CATEGORIES = [
    {"domain": "clean_energy", "topics": ["solar", "wind", "energy_efficiency", "offshore_wind"]},
    {"domain": "workforce_development", "topics": ["skills_gap", "training_programs", "certifications"]},
    {"domain": "career_pathways", "topics": ["entry_level", "mid_career", "advanced", "career_transition"]},
    {"domain": "equity", "topics": ["ej_communities", "diversity", "accessibility", "immigrant_professionals"]},
    {"domain": "policy", "topics": ["massachusetts_policy", "federal_incentives", "local_initiatives"]}
]

# Helper functions for working with the URL structure
def get_all_urls() -> List[str]:
    """Get a flattened list of all URLs"""
    all_urls = []

    # Add ecosystem partner URLs
    for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
        for partner in partners:
            all_urls.extend(partner["urls"])

    # Add resource category URLs
    for category, urls in URL_STRUCTURE["Resource Categories"].items():
        all_urls.extend(urls)

    # Return deduplicated list
    return list(dict.fromkeys(all_urls))

def get_partner_urls(partner_name: str) -> List[str]:
    """Get all URLs for a specific partner organization"""
    for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
        for partner in partners:
            if partner["name"].lower() == partner_name.lower():
                return partner["urls"]
    return []

def get_partner_data(partner_name: str) -> Dict:
    """Get partner data for a specific organization"""
    for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
        for partner in partners:
            if partner["name"].lower() == partner_name.lower():
                return partner
    return {}

def get_urls_by_partner_type(partner_type: str) -> List[str]:
    """Get all URLs for a specific partner type"""
    urls = []
    if partner_type in URL_STRUCTURE["Ecosystem Partners"]:
        for partner in URL_STRUCTURE["Ecosystem Partners"][partner_type]:
            urls.extend(partner["urls"])
    return urls

def get_urls_by_resource_category(category: str) -> List[str]:
    """Get all URLs for a specific resource category"""
    if category in URL_STRUCTURE["Resource Categories"]:
        return URL_STRUCTURE["Resource Categories"][category]
    return []

def get_urls_by_target_audience(audience: str) -> List[str]:
    """Get all URLs for a specific target audience"""
    if audience in URL_STRUCTURE["Target Audience Resources"]:
        return URL_STRUCTURE["Target Audience Resources"][audience]
    return []

def get_all_partners() -> List[Dict]:
    """Get all partner organizations data"""
    partners = []
    for partner_type, partner_list in URL_STRUCTURE["Ecosystem Partners"].items():
        partners.extend(partner_list)
    return partners

@dataclass
class ProcessedChunk:
    """Represents a processed text chunk ready for storage"""
    url: str
    chunk_number: int
    title: str
    summary: str
    content: str
    metadata: Dict[str, Any]
    embedding: List[float]
    source_type: str = "webpage"  # 'webpage' or 'pdf'
    domain: Optional[str] = None
    topics: List[str] = None

def chunk_text(text: str, chunk_size: int = 5000) -> List[str]:
    """Split text into chunks, respecting code blocks and paragraphs."""
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        # Calculate end position
        end = start + chunk_size

        # If we're at the end of the text, just take what's left
        if end >= text_length:
            chunks.append(text[start:].strip())
            break

        # Try to find a code block boundary first (```)
        chunk = text[start:end]
        code_block = chunk.rfind('```')
        if code_block != -1 and code_block > chunk_size * 0.3:
            end = start + code_block

        # If no code block, try to break at a paragraph
        elif '\n\n' in chunk:
            # Find the last paragraph break
            last_break = chunk.rfind('\n\n')
            if last_break > chunk_size * 0.3:  # Only break if we're past 30% of chunk_size
                end = start + last_break

        # If no paragraph break, try to break at a sentence
        elif '. ' in chunk:
            # Find the last sentence break
            last_period = chunk.rfind('. ')
            if last_period > chunk_size * 0.3:  # Only break if we're past 30% of chunk_size
                end = start + last_period + 1

        # Extract chunk and clean it up
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start position for next chunk
        start = max(start + 1, end)

    return chunks

def categorize_content(content: str, url: str) -> Tuple[Optional[str], List[str]]:
    """Categorize content into domain and topics for better organization"""
    # Default to None for domain and empty list for topics
    domain = None
    topics = []

    # Extract domain from URL if possible
    url_lower = url.lower()

    # Check if URL matches any partner
    for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
        for partner in partners:
            if partner["website"] in url_lower:
                # Use partner's climate focus as topics
                topics.extend(partner.get("climate_focus", []))
                break

    # Check resource categories
    for category, urls in URL_STRUCTURE["Resource Categories"].items():
        if url in urls:
            topics.append(category.lower().replace(" ", "_"))

    # Determine domain based on content and URL patterns
    if "renewable" in content.lower() or "solar" in content.lower() or "wind" in content.lower():
        domain = "clean_energy"
    elif "workforce" in content.lower() or "skills" in content.lower() or "training" in content.lower():
        domain = "workforce_development"
    elif "career" in content.lower() or "job" in content.lower() or "profession" in content.lower():
        domain = "career_pathways"
    elif "equity" in content.lower() or "justice" in content.lower() or "diversity" in content.lower():
        domain = "equity"
    elif "policy" in content.lower() or "regulation" in content.lower() or "incentive" in content.lower():
        domain = "policy"

    return domain, topics

class ClimateKnowledgeIngestor:
    """Handles ingestion of climate knowledge data from websites and PDFs into Supabase"""

    def __init__(self, docs_dir: str = "./docs"):
        """Initialize the ingestor with configuration"""
        load_dotenv()
        self.docs_dir = Path(docs_dir)
        self.openai_client = None
        self.supabase_client = None
        self.embeddings = None

        # Check if docs directory exists, if not create it
        if not self.docs_dir.exists():
            self.docs_dir.mkdir(parents=True)

        # Web crawling config
        self.browser_config = None
        self.crawler = None

    async def initialize_clients(self):
        """Initialize OpenAI and Supabase clients"""
        # Check for required environment variables
        missing_vars = []
        for var in ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]:
            if not os.getenv(var):
                missing_vars.append(var)

        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

        try:
            # Import and initialize clients
            from openai import AsyncOpenAI
            from supabase import create_client, Client

            # Initialize OpenAI client
            self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            # Initialize Supabase client
            self.supabase_url = "https://kvtkpguwoaqokcylzpic.supabase.co"
            self.supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGtwZ3V3b2Fxb2tjeWx6cGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk5NjQ0OCwiZXhwIjoyMDYzNTcyNDQ4fQ.f1YjhOVoBfzM5tmIlKXJYWX8WhMEYvCy4hr2ulOHVVg"
            self.supabase_client = create_client(
                self.supabase_url,
                self.supabase_key
            )

            logger.info("Clients initialized successfully")
            return True

        except ImportError as e:
            logger.error(f"Missing required packages: {e}")
            logger.error("Please install with: pip install openai supabase-py crawl4ai pypdf")
            return False

    async def initialize_web_crawler(self):
        """Initialize the web crawler"""
        try:
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

            self.browser_config = BrowserConfig(
                headless=True,
                verbose=False,
                extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
            )
            self.crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

            # Create the crawler instance
            self.crawler = AsyncWebCrawler(config=self.browser_config)
            await self.crawler.start()

            logger.info("Web crawler initialized successfully")
            return True

        except ImportError:
            logger.error("crawl4ai module not found. Please install with 'pip install crawl4ai'")
            return False

    async def get_title_and_summary(self, chunk: str, url: str) -> Dict[str, str]:
        """Extract title and summary using GPT-4."""
        system_prompt = """You are an AI that extracts titles and summaries from documentation chunks.
        Return a JSON object with 'title' and 'summary' keys.
        For the title: If this seems like the start of a document, extract its title. If it's a middle chunk, derive a descriptive title.
        For the summary: Create a concise summary of the main points in this chunk.
        Keep both title and summary concise but informative."""

        try:
            response = await self.openai_client.chat.completions.create(
                model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"URL: {url}\n\nContent:\n{chunk[:1000]}..."}  # Send first 1000 chars for context
                ],
                response_format={ "type": "json_object" }
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error getting title and summary: {e}")
            return {"title": "Error processing title", "summary": "Error processing summary"}

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector from OpenAI."""
        try:
            response = await self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return [0] * 1536  # Return zero vector on error

    async def process_chunk(self, chunk: str, chunk_number: int,
                           source: str, source_type: str = "webpage") -> ProcessedChunk:
        """Process a single chunk of text."""
        # Get title and summary
        extracted = await self.get_title_and_summary(chunk, source)

        # Get embedding
        embedding = await self.get_embedding(chunk)

        # Categorize content
        domain, topics = categorize_content(chunk, source)

        # Create metadata
        metadata = {
            "source": "climate_economy_ecosystem",
            "chunk_size": len(chunk),
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "domain": domain,
            "topics": topics
        }

        # Add URL-specific metadata
        if source_type == "webpage":
            metadata["url_path"] = urlparse(source).path

            # Add partner metadata if available
            for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
                for partner in partners:
                    if source in partner["urls"]:
                        metadata["partner_name"] = partner["name"]
                        metadata["partner_type"] = partner["partner_type"]
                        break
        else:
            metadata["file_name"] = Path(source).name

            # Add PDF-specific metadata
            for pdf_info in CLIMATE_DOMAIN_RESOURCES:
                if pdf_info["file"] == Path(source).name:
                    metadata["title"] = pdf_info["title"]
                    metadata["domain"] = pdf_info["domain"]
                    metadata["topics"] = pdf_info["topics"]
                    break

        return ProcessedChunk(
            url=source,
            chunk_number=chunk_number,
            title=extracted['title'],
            summary=extracted['summary'],
            content=chunk,
            metadata=metadata,
            embedding=embedding,
            source_type=source_type,
            domain=domain,
            topics=topics if topics else []
        )

    async def insert_content(self, chunk: ProcessedChunk):
        """Insert a processed chunk into Supabase knowledge_resources table."""
        try:
            # Insert into knowledge_resources table
            data = {
                "title": chunk.title,
                "description": chunk.summary,
                "content_type": "webpage" if chunk.source_type == "webpage" else "pdf",
                "content": chunk.content,
                "source_url": chunk.url,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "is_published": True,
                "tags": chunk.topics if chunk.topics else [],
                "categories": [chunk.domain] if chunk.domain else [],
                "embedding": chunk.embedding,
                "metadata": chunk.metadata
            }

            # Set partner_id based on metadata
            if "partner_name" in chunk.metadata:
                partner_data = get_partner_data(chunk.metadata["partner_name"])
                if partner_data:
                    # Look up partner ID or create if doesn't exist
                    partner = await self.get_or_create_partner(partner_data)
                    if partner and "id" in partner:
                        data["partner_id"] = partner["id"]

            result = self.supabase_client.table("knowledge_resources").insert(data).execute()
            resource_id = result.data[0]["id"] if result.data else None

            logger.info(f"Inserted knowledge resource: {chunk.title} from {chunk.url}")
            return resource_id

        except Exception as e:
            logger.error(f"Error inserting knowledge resource: {e}")
            return None

    async def get_or_create_partner(self, partner_data: Dict) -> Dict:
        """Get or create a partner record."""
        try:
            # Check if partner exists
            partner_name = partner_data["name"]
            result = self.supabase_client.table("partner_profiles").select("*").eq("organization_name", partner_name).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"Found existing partner: {partner_name}")
                return result.data[0]

            # Create new partner - IMPORTANT: Do not include id field, let Supabase generate it
            data = {
                "organization_name": partner_name,
                "organization_type": partner_data["partner_type"],
                "website": partner_data["website"],
                "description": f"Partner organization: {partner_name}",
                "partnership_level": partner_data.get("partnership_level", "standard"),
                "climate_focus": partner_data.get("climate_focus", []),
                "verified": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            logger.info(f"Creating new partner: {partner_name} with data: {data}")
            result = self.supabase_client.table("partner_profiles").insert(data).execute()
            logger.info(f"Created partner: {partner_name}, result: {result.data if result.data else 'No data returned'}")
            return result.data[0] if result.data else None

        except Exception as e:
            logger.error(f"Error getting/creating partner: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {}

    async def process_and_store_document(self, source: str, content: str, source_type: str = "webpage", partner_data: Dict = None):
        """Process a document and store its chunks."""
        # Split into chunks
        chunks = chunk_text(content)

        # Process chunks
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            processed_chunk = await self.process_chunk(chunk, i, source, source_type)
            if partner_data:
                processed_chunk.metadata["partner_name"] = partner_data["name"]
                processed_chunk.metadata["partner_type"] = partner_data["partner_type"]
            processed_chunks.append(processed_chunk)

        # Store chunks
        for chunk in processed_chunks:
            await self.insert_content(chunk)

        # Return the number of chunks processed
        return len(chunks)

    async def crawl_urls(self, urls: List[str], max_concurrent: int = 5):
        """Crawl multiple URLs in parallel with a concurrency limit."""
        if not self.crawler:
            success = await self.initialize_web_crawler()
            if not success:
                return {"crawled": 0, "failed": len(urls)}

        try:
            # Stats for tracking
            stats = {"crawled": 0, "failed": 0}

            # Create a semaphore to limit concurrency
            semaphore = asyncio.Semaphore(max_concurrent)

            async def process_url(url: str):
                async with semaphore:
                    try:
                        result = await self.crawler.arun(
                            url=url,
                            config=self.crawl_config,
                            session_id="climate_session"
                        )
                        if result.success:
                            logger.info(f"Successfully crawled: {url}")

                            # Find partner data if available
                            partner_data = None
                            for partner_type, partners in URL_STRUCTURE["Ecosystem Partners"].items():
                                for partner in partners:
                                    if url in partner["urls"]:
                                        partner_data = partner
                                        break
                                if partner_data:
                                    break

                            await self.process_and_store_document(url, result.markdown.raw_markdown, "webpage", partner_data)
                            stats["crawled"] += 1
                        else:
                            logger.error(f"Failed to crawl {url}: {result.error_message}")
                            stats["failed"] += 1
                    except Exception as e:
                        logger.error(f"Error processing URL {url}: {e}")
                        stats["failed"] += 1

            # Process all URLs in parallel with limited concurrency
            await asyncio.gather(*[process_url(url) for url in urls])

            return stats

        except Exception as e:
            logger.error(f"Error during URL crawling: {e}")
            return {"crawled": 0, "failed": len(urls)}
        finally:
            # We don't close the crawler here to allow for multiple batches
            pass

    async def process_pdf(self, pdf_info: Dict) -> Dict[str, Any]:
        """Process a single PDF file."""
        try:
            # Import PDF processing libraries
            import pypdf

            pdf_path = self.docs_dir / pdf_info["file"]
            logger.info(f"Processing PDF: {pdf_path}")

            # Check if file exists
            if not pdf_path.exists():
                logger.error(f"PDF file not found: {pdf_path}")
                return {"status": "error", "message": f"File not found: {pdf_path}"}

            # Extract text from PDF
            pdf_reader = pypdf.PdfReader(str(pdf_path))
            text = ""

            for page in pdf_reader.pages:
                text += page.extract_text() + "\n\n"

            # Process and store the document
            chunks_count = await self.process_and_store_document(
                str(pdf_path),
                text,
                source_type="pdf"
            )

            return {
                "status": "success",
                "chunks": chunks_count,
                "domain": pdf_info["domain"],
                "topics": pdf_info["topics"]
            }

        except ImportError:
            logger.error("pypdf not installed. Install with: pip install pypdf")
            return {"status": "error", "message": "Required package pypdf not installed"}
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            return {"status": "error", "message": str(e)}

    async def ingest_pdfs(self) -> Dict[str, int]:
        """Ingest PDFs into the database."""
        stats = {"processed": 0, "added": 0, "failed": 0}

        for pdf_info in CLIMATE_DOMAIN_RESOURCES:
            try:
                # Process PDF
                result = await self.process_pdf(pdf_info)

                if result["status"] == "success":
                    stats["processed"] += 1
                    stats["added"] += result["chunks"]
                    logger.info(f"Successfully processed {pdf_info['file']}")
                else:
                    stats["failed"] += 1
                    logger.error(f"Failed to process {pdf_info['file']}: {result.get('message')}")

            except Exception as e:
                logger.error(f"Error processing {pdf_info['file']}: {str(e)}")
                stats["failed"] += 1

        return stats

    async def ingest_partner_data(self):
        """Ingest partner data into the database."""
        stats = {"partners": 0}

        try:
            # Get all partners
            partners = get_all_partners()

            # Insert each partner
            for partner in partners:
                result = await self.get_or_create_partner(partner)
                if result and "id" in result:
                    stats["partners"] += 1

            logger.info(f"Successfully ingested {stats['partners']} partners")
            return stats

        except Exception as e:
            logger.error(f"Error ingesting partner data: {e}")
            return stats

async def setup_supabase():
    """Main function to set up Supabase with climate knowledge data."""
    # Initialize the ingestor
    ingestor = ClimateKnowledgeIngestor(docs_dir="./temp_repo_clean/pdfs")

    # Initialize clients
    logger.info("Initializing clients...")
    success = await ingestor.initialize_clients()
    if not success:
        logger.error("Failed to initialize clients. Exiting.")
        return

    # Initialize web crawler
    logger.info("Initializing web crawler...")
    success = await ingestor.initialize_web_crawler()
    if not success:
        logger.error("Failed to initialize web crawler. Exiting.")
        return

    # Process PDFs
    logger.info("Processing PDFs...")
    pdf_stats = await ingestor.ingest_pdfs()
    logger.info(f"PDF processing complete: {pdf_stats}")

    # Process URLs
    logger.info("Processing URLs...")
    urls = get_all_urls()
    logger.info(f"Found {len(urls)} URLs to process")
    url_stats = await ingestor.crawl_urls(urls, max_concurrent=3)
    logger.info(f"URL processing complete: {url_stats}")

    # Ingest partner data
    logger.info("Ingesting partner data...")
    partner_stats = await ingestor.ingest_partner_data()
    logger.info(f"Partner data ingestion complete: {partner_stats}")

    # Close the crawler
    if ingestor.crawler:
        await ingestor.crawler.close()

    logger.info("Setup complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(setup_supabase())