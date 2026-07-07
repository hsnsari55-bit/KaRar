# Engineering History: Dataset Classification

**Date:** July 7, 2026  
**Decision Type:** Architectural Principle  
**Status:** Active  
**Impact:** Documentation, Testing Strategy, Future Development

---

## Executive Summary

KaRar's primary purpose is to understand **real-world architectural projects** and eventually reconstruct BIM and 3D buildings. The real architectural permit project serves as the primary reference dataset, not synthetic toy DXF files.

---

## Dataset Classification System

### 1. Primary Reference Project

**Definition:** Real-world architectural permit project used as the primary reference for KaRar development.

**Current Primary Reference:**
- **Project Name:** GÜZELCE 467 ADA 3 PARSEL
- **File:** [`data/GÜZELCE 467 ADA 3 PARSEL .(23.12.2025).dxf`](../data/GÜZELCE 467 ADA 3 PARSEL .(23.12.2025).dxf:1)
- **Type:** Real architectural permit drawing
- **Complexity:** Production-level architectural project
- **Purpose:** Primary validation dataset for all KaRar features

**Characteristics:**
- ✅ Real-world coordinate systems
- ✅ Production-level complexity
- ✅ Authentic layer naming conventions
- ✅ Real architectural standards
- ✅ Multiple building units (villas)
- ✅ Complete architectural elements (walls, doors, windows, rooms)
- ✅ Real-world precision artifacts and imperfections

**Usage:**
- Primary validation for all detection algorithms
- Reference for BIM reconstruction accuracy
- Benchmark for performance optimization
- Source of truth for architectural understanding
- Training data for future AI models

---

### 2. Regression / Unit Test Dataset

**Definition:** Small synthetic DXF files created for specific testing purposes.

**Current Test Files:**
- **File:** [`data/test_plan.dxf`](../data/test_plan.dxf:1)
- **Type:** Synthetic test file
- **Complexity:** Simplified geometric patterns
- **Purpose:** Unit testing and regression testing

**Characteristics:**
- ✅ Simplified geometry for isolated testing
- ✅ Controlled coordinate systems
- ✅ Predictable entity counts
- ✅ Known ground truth
- ✅ Fast processing for CI/CD
- ✅ Specific edge case coverage

**Usage:**
- Unit tests for individual modules
- Regression tests to prevent bugs
- Performance benchmarking (baseline)
- Edge case validation
- CI/CD pipeline testing
- Development iteration speed

---

## Engineering Implications

### 1. Development Philosophy

**Primary Reference Project First:**
```
Real-world complexity → Algorithm design → Synthetic test validation
```

**NOT:**
```
Synthetic simplicity → Algorithm design → Real-world failure
```

### 2. Testing Strategy

**Validation Hierarchy:**
1. **Primary:** Must work on GÜZELCE 467 ADA 3 PARSEL project
2. **Secondary:** Must pass regression tests on synthetic datasets
3. **Tertiary:** Must handle edge cases in unit tests

**Success Criteria:**
- ✅ Detection algorithms validated on primary reference project
- ✅ Regression tests prevent breaking changes
- ✅ Unit tests ensure component correctness

### 3. Performance Optimization

**Optimization Priority:**
1. **First:** Optimize for primary reference project (real-world scale)
2. **Second:** Ensure acceptable performance on larger projects
3. **Third:** Fast execution on synthetic test files (bonus)

**Anti-Pattern:**
- ❌ Optimizing for toy DXF files at the expense of real-world performance
- ❌ Simplifying algorithms to pass synthetic tests but fail on real data
- ❌ Ignoring real-world precision issues because synthetic data is clean

### 4. Documentation Standards

**Dataset References:**
- Always specify which dataset is being discussed
- Clearly label synthetic vs. real-world examples
- Document known issues specific to each dataset type
- Report metrics separately for each dataset category

**Example:**
```markdown
## Test Results

### Primary Reference Project (GÜZELCE 467 ADA 3 PARSEL)
- Walls detected: 156
- Doors detected: 42
- Rooms detected: 18
- Processing time: 8.3s

### Regression Dataset (test_plan.dxf)
- Walls detected: 12
- Doors detected: 3
- Rooms detected: 4
- Processing time: 0.2s
```

### 5. Algorithm Design

**Design Principles:**
- Algorithms must handle real-world imperfections (floating-point precision, unclosed polygons, inconsistent layers)
- Tolerance values tuned for primary reference project, not synthetic data
- Validation logic based on real architectural standards
- Error handling for production-level complexity

**Example:**
```python
# Good: Tolerance tuned for real-world data
SNAP_TOLERANCE = 5.0  # Based on GÜZELCE project analysis

# Bad: Tolerance optimized for synthetic data
SNAP_TOLERANCE = 0.1  # Works on test_plan.dxf but fails on real data
```

### 6. Future AI Training

**Training Data Priority:**
1. **Primary:** Real architectural permit projects (GÜZELCE and future additions)
2. **Augmentation:** Synthetic variations of real projects
3. **Edge Cases:** Synthetic test files for specific scenarios

**Rationale:**
- AI models must learn real-world patterns, not synthetic simplifications
- Generalization requires diverse real-world examples
- Synthetic data useful for augmentation, not primary training

---

## Historical Context

### Why This Decision Matters

**Previous Approach Risk:**
- Danger of optimizing for toy examples
- Algorithms that work on simple synthetic files but fail on real projects
- False sense of progress from passing synthetic tests
- Disconnect between development and production reality

**New Approach Benefits:**
- ✅ Development grounded in real-world complexity
- ✅ Algorithms validated on production data
- ✅ Clear understanding of actual vs. test performance
- ✅ Foundation for BIM and 3D reconstruction of real buildings
- ✅ Training data for AI models reflects real architectural patterns

### Connection to KaRar Vision

From [`00_CTO_MANIFESTO.md`](00_CTO_MANIFESTO.md:1):

> **KaRar is not a DXF viewer. KaRar is an AI-powered engineering platform that transforms architectural drawings into intelligent digital twins.**

**This decision reinforces:**
- Focus on real-world architectural understanding
- BIM reconstruction from actual permit projects
- AI training on production-quality data
- Long-term vision of construction intelligence platform

---

## Implementation Guidelines

### For Developers

**When writing code:**
1. Test first on primary reference project (GÜZELCE)
2. Validate with regression tests (test_plan.dxf)
3. Add unit tests for specific edge cases
4. Document which dataset was used for validation

**When reporting issues:**
```markdown
## Issue: Door detection failing

**Dataset:** Primary Reference Project (GÜZELCE 467 ADA 3 PARSEL)
**Expected:** 42 doors detected
**Actual:** 0 doors detected
**Root Cause:** Wall matching tolerance too strict for real-world coordinates
```

### For Documentation

**Always specify dataset context:**
- "Tested on primary reference project (GÜZELCE)"
- "Regression test using synthetic dataset (test_plan.dxf)"
- "Unit test with controlled synthetic geometry"

**Performance metrics:**
- Report separately for each dataset category
- Explain differences between synthetic and real-world performance
- Set expectations based on primary reference project

### For Testing

**Test Suite Structure:**
```
tests/
├── integration/
│   ├── test_primary_reference_project.py  # GÜZELCE project
│   └── test_real_world_scenarios.py       # Future real projects
├── regression/
│   ├── test_synthetic_plans.py            # test_plan.dxf
│   └── test_edge_cases.py                 # Specific scenarios
└── unit/
    ├── test_geometry_engine.py            # Isolated components
    └── test_detection_algorithms.py       # Individual functions
```

---

## Future Expansion

### Additional Primary Reference Projects

**Planned Additions:**
- Residential multi-family buildings
- Commercial office buildings
- Mixed-use developments
- Renovation projects
- Infrastructure projects

**Criteria for Primary Reference Status:**
1. Real architectural permit drawing
2. Production-quality complexity
3. Complete architectural elements
4. Representative of target market
5. Diverse enough to test generalization

### Synthetic Dataset Evolution

**Planned Additions:**
- Edge case collections (unclosed polygons, overlapping entities)
- Performance benchmarks (varying entity counts)
- Specific feature tests (door types, window configurations)
- Regression prevention (fixed bugs)

**Criteria for Regression Dataset:**
1. Fast execution (< 1 second)
2. Known ground truth
3. Isolated feature testing
4. Reproducible results
5. CI/CD friendly

---

## Related Documents

- [`00_CTO_MANIFESTO.md`](00_CTO_MANIFESTO.md:1) - Overall KaRar vision and principles
- [`PROJECT_STATE.md`](../PROJECT_STATE.md:1) - Current project status
- [`CHANGELOG.md`](../CHANGELOG.md:1) - Development history
- [`docs/Progress.md`](../docs/Progress.md:1) - Sprint progress tracking

---

## Conclusion

**KaRar is built to understand real-world architectural projects, not toy DXF files.**

The GÜZELCE 467 ADA 3 PARSEL project is our primary reference dataset. All algorithms, optimizations, and validations must prioritize real-world complexity over synthetic simplicity. Regression tests serve their purpose—preventing bugs and enabling fast iteration—but they are not the measure of success.

**Success is measured by our ability to reconstruct BIM and 3D buildings from real architectural permit projects.**

---

**Document Owner:** CTO, KaRar Project  
**Created:** July 7, 2026  
**Last Updated:** July 7, 2026  
**Next Review:** October 2026

---

*This document establishes a fundamental principle for KaRar development. All team members, contributors, and future developers must understand and follow this dataset classification system.*
