KaRar OS Version : 1.1.0
Document Version : 1.1
Last Updated     : 2026-07-15
Status           : Active
Owner            : KaRar

# 06_KNOWLEDGE_BASE

---

# Purpose

This document stores engineering knowledge used by the KaRar project.

It is the permanent technical knowledge base shared by every AI working on KaRar.

---

# Project Vision

KaRar is not a DXF viewer.

KaRar is an AI-powered engineering platform capable of understanding architectural drawings and generating intelligent BIM models.

---

# Geometry Engine

Responsible for converting raw CAD entities into clean geometry.

Main responsibilities

• Merge wall segments

• Remove duplicates

• Detect intersections

• Normalize coordinates

• Generate clean wall centerlines

• Preserve geometric consistency

---

# Semantic Engine

Responsible for understanding architectural elements.

Objects

• Wall

• Door

• Window

• Column

• Room

• Stair

• Slab

• Roof

The Semantic Engine operates on clean geometry produced by the Geometry Engine.

---

# Topology Engine

Responsible for relationships.

Examples

Wall ↔ Door

Wall ↔ Window

Room ↔ Wall

Room ↔ Door

Column ↔ Wall

The Topology Engine creates the structural graph used by the BIM Core.

---

# BIM Core

Creates intelligent building objects.

Each object contains

Geometry

Semantic data

Relationships

Properties

Metadata

Unique identifiers

---

# 3D Engine

Creates professional 3D models.

Outputs

OBJ

FBX

glTF

IFC

Future outputs may include additional industry-standard formats.

---

# Render Engine

Creates visualization.

Future targets

Cycles

Eevee

GPU Rendering

Material Library

Lighting

---

# AI Collaboration Knowledge

Primary AI Coding Agent

Cline

Primary Local Runtime

Ollama

Primary Local Models

• qwen2.5:14b

• qwen2.5:32b

Project Memory

• .kaRar

All AI assistants must use the same project knowledge stored in this directory.

---

# Engineering Principles

The project must always

• preserve modular architecture

• avoid unnecessary rewrites

• inspect existing code before modification

• document important engineering decisions

• maintain compatibility with future BIM development

---

# AI Goals

Understand architecture.

Not only geometry.

Understand building logic.

Generate intelligent buildings.

Support fully automatic BIM generation.

Support future Digital Twin workflows.
