KaRar OS Version : 1.0.0
Document Version : 1.0
Last Updated     : 2026-07-09
Status           : Active
Owner            : KaRar

# 06_KNOWLEDGE_BASE

---

# Purpose

This document stores engineering knowledge used by the KaRar project.

It is the long-term technical memory of the system.

---

# Geometry Engine

Responsible for converting raw CAD entities into clean geometry.

Main responsibilities

• Merge wall segments

• Remove duplicates

• Detect intersections

• Normalize coordinates

• Generate clean wall centerlines

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

---

# Topology Engine

Responsible for relationships.

Examples

Wall ↔ Door

Wall ↔ Window

Room ↔ Wall

Room ↔ Door

Column ↔ Wall

---

# BIM Core

Creates intelligent building objects.

Each object contains

Geometry

Semantic data

Relationships

Properties

Metadata

---

# 3D Engine

Creates professional 3D models.

Outputs

OBJ

FBX

glTF

IFC

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

# AI Goals

Understand architecture.

Not only geometry.

Understand building logic.

Generate intelligent buildings.
