import pytest
from unittest.mock import AsyncMock
from typing import List, Dict, Any

# Modules to test - Adjusted import path
from mass_climate_assistant.lib.tools.tools import (
    search_knowledge_base,
    MemoryResult,
    SearchKnowledgeBaseInput,
    get_ecosystem_partners, GetPartnersInput,
    search_clean_energy_web, SearchWebInput,
    search_massachusetts_resources, SearchMAResourcesInput,
    search_clean_energy_occupations, SearchOccupationsInput,
    search_training_programs, SearchTrainingInput,
    locate_ej_training_resources, LocateEJInput,
    find_dei_programs, FindDEIInput,
    translate_military_occupation, TranslateMOSInput,
    find_veteran_benefits, FindVeteranBenefitsInput,
    evaluate_international_credential, EvaluateCredentialInput,
    find_international_integration_resources, FindIntlIntegrationInput,
    analyze_resume, AnalyzeResumeInput,
    get_career_paths, GetCareerPathsInput,
    find_training_resources, FindTrainingResourcesInput,
    match_jobs, MatchJobsInput,
    create_development_plan, CreateDevPlanInput,
    get_domain_reports, GetDomainReportsInput
)

# Use pytest-asyncio for async tests
pytestmark = pytest.mark.asyncio

# --- Integration Tests ---
# NOTE: These tests require a properly configured environment
# with access to the live Supabase database.

# --- Test search_knowledge_base ---

# Removed @patch
async def test_search_knowledge_base_integration():
    '''Tests knowledge base search against the live database.'''
    query = "climate action plan massachusetts"
    filters = {"max_results": 2}

    # Call the tool function
    results = await search_knowledge_base(query=query, filters=filters)

    # Assertions: Check if results are a list and items are MemoryResult or don't contain specific errors
    assert isinstance(results, list)
    if results:
        assert isinstance(results[0], MemoryResult)
        # Check it's not the specific known error messages from the function
        assert "Database service unavailable" not in results[0].content
        assert "Failed to search knowledge base" not in results[0].content
    # Add more specific assertions based on expected live data if possible

# --- Test get_ecosystem_partners ---

# Removed @patch
async def test_get_ecosystem_partners_integration():
    '''Tests retrieval of ecosystem partners against the live database.'''
    query = "solar companies boston"

    results = await get_ecosystem_partners(query=query)

    # Assertions: Check it's a list, items are dicts, and don't contain known errors
    assert isinstance(results, list)
    if results:
        assert isinstance(results[0], dict)
        assert results[0].get("error") != "Database service unavailable"
        assert "Failed to get ecosystem partners" not in results[0].get("error", "")
    # Add more specific assertions based on expected live data if possible

# --- Test translate_military_occupation ---

# Removed @patch
async def test_translate_military_occupation_integration_found():
    '''Tests translation of a potentially existing MOS code.'''
    # Use a common MOS code that *might* be in the DB
    mos_code = "11B"

    result = await translate_military_occupation(mos_code=mos_code)

    # Assertions: Check it's a dict and doesn't contain known errors
    assert isinstance(result, dict)
    assert result.get("error") != "Database service unavailable"
    assert "Failed to translate military occupation" not in result.get("error", "")
    # Check if either a translation or the 'not found' message is present
    assert result.get("civilian_equivalent") is not None or "not found in database" in result.get("message", "")

# Removed @patch
async def test_translate_military_occupation_integration_not_found():
    '''Tests translation of a likely non-existent MOS code.'''
    mos_code = "XYZ99ABC"
    expected_not_found_message = "Specific MOS code not found in database"

    result = await translate_military_occupation(mos_code=mos_code)

    assert isinstance(result, dict)
    assert result.get("error") != "Database service unavailable"
    assert "Failed to translate military occupation" not in result.get("error", "")
    # Expect the 'not found' message or potentially an empty dict if DB returns nothing
    assert expected_not_found_message in result.get("message", "") or result.get("mos_code") == mos_code.upper()

# --- Test analyze_resume ---
# This tool currently uses placeholder logic and doesn't hit the DB
# It can be tested without mocks for its current state.

async def test_analyze_resume_integration():
    '''Tests resume analysis (using placeholder logic).'''
    resume_text = "Experienced project manager..."
    expected_result = {"mock_analysis": "Replace with actual analysis"} # Placeholder

    result = await analyze_resume(resume_text=resume_text)

    assert result == expected_result

async def test_analyze_resume_no_text_integration():
    '''Tests resume analysis when no text is provided.'''
    expected_error = {"error": "No resume text provided"}
    result = await analyze_resume(resume_text="")
    assert result == expected_error

# --- Test match_jobs ---

# Removed @patch
async def test_match_jobs_integration():
    '''Tests job matching against the live database.'''
    criteria = {"skills": ["project management", "renewable energy"], "location": "Massachusetts"}

    results = await match_jobs(criteria=criteria)

    # Assertions: Check it's a list, items are dicts, and don't contain known errors
    assert isinstance(results, list)
    if results:
        assert isinstance(results[0], dict)
        assert results[0].get("error") != "Database service unavailable"
        assert "Failed to match jobs" not in results[0].get("error", "")
    # Add more specific assertions based on expected live data if possible

# --- Test search_clean_energy_web ---

# Removed @patch
async def test_search_clean_energy_web_integration():
    '''Tests clean energy web search (via partners) against live DB.'''
    query = "offshore wind companies ma"

    results = await search_clean_energy_web(query=query)

    # Assertions: Check it's a list, items are dicts, and don't contain known errors
    # This relies on get_ecosystem_partners working correctly
    assert isinstance(results, list)
    if results:
        assert isinstance(results[0], dict)
        assert results[0].get("error") != "Database service unavailable"
        # Errors from the underlying get_ecosystem_partners call are passed through
        assert "Failed to get ecosystem partners" not in results[0].get("error", "")
        assert "Failed to search web via partners" not in results[0].get("error", "")

# --- Add integration tests for remaining tools ---