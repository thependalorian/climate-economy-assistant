#!/usr/bin/env python3
"""
Security and Scalability Check Script

This script scans the codebase for potential security and scalability issues.
It checks for:
1. Hardcoded secrets
2. Missing input validation
3. Insecure dependencies
4. Potential performance bottlenecks
5. Missing error handling
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any

# Configuration
REPO_ROOT = Path(__file__).parent.parent
IGNORE_DIRS = {
    ".git", 
    "node_modules", 
    ".next", 
    "__pycache__", 
    ".venv", 
    "venv",
    "dist",
    "build"
}
CODE_EXTENSIONS = {
    ".py", 
    ".js", 
    ".jsx", 
    ".ts", 
    ".tsx", 
    ".json", 
    ".yml", 
    ".yaml"
}

# Patterns to check
SECURITY_PATTERNS = {
    "hardcoded_secret": re.compile(r'(password|secret|key|token|auth).*?["\']([a-zA-Z0-9_\-\.=]{8,})["\']', re.IGNORECASE),
    "sql_injection": re.compile(r'execute\([\'"].*?\%.*?[\'"]\s*%\s*\(', re.IGNORECASE),
    "xss_vulnerability": re.compile(r'(innerHTML|outerHTML|document\.write|eval\()', re.IGNORECASE),
    "no_input_validation": re.compile(r'(req\.body|req\.query|req\.params|request\.body|request\.query|request\.params).*?(?!validate|sanitize|check)', re.IGNORECASE),
    "insecure_cookie": re.compile(r'(cookie|setCookie).*?(?!secure|httpOnly)', re.IGNORECASE),
}

SCALABILITY_PATTERNS = {
    "n_plus_one": re.compile(r'for.*?in.*?(await|fetch|get|query|find)', re.IGNORECASE),
    "missing_pagination": re.compile(r'(find|get|query|fetch).*?(?!limit|skip|page|offset)', re.IGNORECASE),
    "blocking_operation": re.compile(r'(readFileSync|writeFileSync|execSync)', re.IGNORECASE),
    "missing_cache": re.compile(r'(fetch|get|query).*?(?!cache|memo)', re.IGNORECASE),
    "missing_error_handling": re.compile(r'(try).*?(?!catch)', re.IGNORECASE),
}

def scan_file(file_path: Path) -> Tuple[Dict[str, List[int]], Dict[str, List[int]]]:
    """Scan a file for security and scalability issues."""
    security_issues = {pattern: [] for pattern in SECURITY_PATTERNS}
    scalability_issues = {pattern: [] for pattern in SCALABILITY_PATTERNS}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines, 1):
            # Skip comments
            if line.strip().startswith(('#', '//', '/*', '*', '*/')):
                continue
                
            # Check security patterns
            for pattern_name, pattern in SECURITY_PATTERNS.items():
                if pattern.search(line):
                    security_issues[pattern_name].append(i)
                    
            # Check scalability patterns
            for pattern_name, pattern in SCALABILITY_PATTERNS.items():
                if pattern.search(line):
                    scalability_issues[pattern_name].append(i)
    except Exception as e:
        print(f"Error scanning {file_path}: {e}")
        
    return security_issues, scalability_issues

def check_dependencies() -> Dict[str, List[Dict[str, Any]]]:
    """Check for vulnerable dependencies."""
    vulnerabilities = {
        "python": [],
        "node": []
    }
    
    # Check Python dependencies
    requirements_file = REPO_ROOT / "requirements.txt"
    if requirements_file.exists():
        try:
            result = subprocess.run(
                ["pip-audit", "-r", str(requirements_file), "--format", "json"],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0:
                vulnerabilities["python"] = json.loads(result.stdout)
        except Exception as e:
            print(f"Error checking Python dependencies: {e}")
    
    # Check Node.js dependencies
    package_lock = REPO_ROOT / "package-lock.json"
    if package_lock.exists():
        try:
            result = subprocess.run(
                ["npm", "audit", "--json"],
                capture_output=True,
                text=True,
                check=False,
                cwd=REPO_ROOT
            )
            if result.returncode == 0:
                vulnerabilities["node"] = json.loads(result.stdout)
        except Exception as e:
            print(f"Error checking Node.js dependencies: {e}")
    
    return vulnerabilities

def scan_codebase() -> Dict[str, Any]:
    """Scan the entire codebase for security and scalability issues."""
    results = {
        "security_issues": {},
        "scalability_issues": {},
        "file_count": 0,
        "line_count": 0,
        "vulnerable_dependencies": {}
    }
    
    # Scan files
    for root, dirs, files in os.walk(REPO_ROOT):
        # Skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            rel_path = file_path.relative_to(REPO_ROOT)
            
            # Skip files with non-code extensions
            if file_path.suffix not in CODE_EXTENSIONS:
                continue
                
            results["file_count"] += 1
            
            # Count lines
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    line_count = sum(1 for _ in f)
                    results["line_count"] += line_count
            except Exception:
                pass
                
            # Scan for issues
            security_issues, scalability_issues = scan_file(file_path)
            
            # Add non-empty issues to results
            for pattern, lines in security_issues.items():
                if lines:
                    if pattern not in results["security_issues"]:
                        results["security_issues"][pattern] = {}
                    results["security_issues"][pattern][str(rel_path)] = lines
                    
            for pattern, lines in scalability_issues.items():
                if lines:
                    if pattern not in results["scalability_issues"]:
                        results["scalability_issues"][pattern] = {}
                    results["scalability_issues"][pattern][str(rel_path)] = lines
    
    # Check dependencies
    try:
        results["vulnerable_dependencies"] = check_dependencies()
    except Exception as e:
        print(f"Error checking dependencies: {e}")
    
    return results

def format_results(results: Dict[str, Any]) -> str:
    """Format the scan results into a readable report."""
    report = []
    
    report.append("# Security and Scalability Scan Report")
    report.append(f"\nScanned {results['file_count']} files with {results['line_count']} lines of code.\n")
    
    # Security issues
    report.append("## Security Issues")
    if not results["security_issues"]:
        report.append("\nNo security issues found.")
    else:
        for pattern, files in results["security_issues"].items():
            report.append(f"\n### {pattern.replace('_', ' ').title()}")
            report.append(f"Found in {len(files)} files:")
            for file, lines in files.items():
                report.append(f"- {file}: lines {', '.join(map(str, lines))}")
    
    # Scalability issues
    report.append("\n## Scalability Issues")
    if not results["scalability_issues"]:
        report.append("\nNo scalability issues found.")
    else:
        for pattern, files in results["scalability_issues"].items():
            report.append(f"\n### {pattern.replace('_', ' ').title()}")
            report.append(f"Found in {len(files)} files:")
            for file, lines in files.items():
                report.append(f"- {file}: lines {', '.join(map(str, lines))}")
    
    # Vulnerable dependencies
    report.append("\n## Vulnerable Dependencies")
    
    # Python dependencies
    python_vulns = results.get("vulnerable_dependencies", {}).get("python", [])
    if python_vulns:
        report.append("\n### Python Dependencies")
        for vuln in python_vulns:
            report.append(f"- {vuln['package']}: {vuln['vulnerability']}")
    else:
        report.append("\nNo vulnerable Python dependencies found.")
    
    # Node.js dependencies
    node_vulns = results.get("vulnerable_dependencies", {}).get("node", [])
    if node_vulns:
        report.append("\n### Node.js Dependencies")
        for vuln in node_vulns:
            report.append(f"- {vuln['package']}: {vuln['vulnerability']}")
    else:
        report.append("\nNo vulnerable Node.js dependencies found.")
    
    return "\n".join(report)

def main():
    """Main function."""
    print("Scanning codebase for security and scalability issues...")
    results = scan_codebase()
    
    report = format_results(results)
    
    # Write report to file
    report_path = REPO_ROOT / "security_scalability_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Scan complete. Report written to {report_path}")
    
    # Return non-zero exit code if issues found
    if results["security_issues"] or results["scalability_issues"]:
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
