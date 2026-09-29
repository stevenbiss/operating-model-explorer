---
id: flow
type: process
name: Main flow
workstream: main-ws
steps:
  - id: start
    name: Start the work
    owner: account-lead
    description: "Step text <script>alert(3)</script> <img src=x onerror=alert(4)>"
  - id: design
    name: Design the answer
    owner: solution-architect
---
Before the script.

<script>alert(1)</script>

<img src=x onerror="alert(2)">

After the script.
