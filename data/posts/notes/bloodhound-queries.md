---
title: "BloodHound Custom Cypher Query Cheat Sheet"
date: "2025-11-01"
type: note
tags: [bloodhound, active-directory, cypher, graph-queries, neo4j]
summary: "Quick reference for the most useful BloodHound Cypher queries — from shortest paths to Kerberoastable DAs, custom tier analysis, and owned-node traversal."
published: true
---

## Basic Path Queries

```cypher
// Shortest path from owned user to Domain Admins
MATCH p=shortestPath((u:User {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"}))
RETURN p

// All paths from owned nodes to DA (longer, more thorough)
MATCH p=allShortestPaths((u:User {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"}))
RETURN p
```

## Kerberoastable Accounts

```cypher
// All Kerberoastable users
MATCH (u:User {hasspn:true}) RETURN u.name, u.description

// Kerberoastable users who are Domain Admins
MATCH (u:User {hasspn:true})-[:MemberOf*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"})
RETURN u.name

// High-value Kerberoastable accounts (admincount=true)
MATCH (u:User {hasspn:true, admincount:true}) RETURN u.name
```

## AS-REP Roastable Users

```cypher
// All accounts without Kerberos pre-auth
MATCH (u:User {dontreqpreauth:true}) RETURN u.name, u.description

// AS-REP roastable users with paths to DA
MATCH p=shortestPath(
  (u:User {dontreqpreauth:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"})
) RETURN p
```

## ACL / Permission Queries

```cypher
// Find objects with WriteDACL on the domain
MATCH (n)-[:WriteDACL]->(d:Domain) RETURN n.name, labels(n)

// GenericAll on privileged accounts
MATCH (u)-[:GenericAll]->(v:User {admincount:true})
RETURN u.name, v.name

// All principals with DCSync rights
MATCH p=(n)-[:DCSync|AllExtendedRights|GenericAll*1..]->(d:Domain)
RETURN p
```

## Owned Node Analysis

```cypher
// Mark a user as owned
MATCH (u:User {name:"SVC-ALFRESCO@HTB.LOCAL"}) SET u.owned=true

// What can owned users reach?
MATCH p=(u:User {owned:true})-[r:MemberOf|AdminTo|HasSession|AllowedToDelegate*1..5]->(n)
RETURN p LIMIT 100

// Sessions of owned users on computers
MATCH p=(u:User {owned:true})-[:HasSession]->(c:Computer)
RETURN p
```

## Delegation Queries

```cypher
// Unconstrained delegation (except DCs)
MATCH (c:Computer {unconstraineddelegation:true})
WHERE NOT c.name STARTS WITH "DC"
RETURN c.name

// Constrained delegation targets
MATCH (n)-[:AllowedToDelegate]->(c:Computer)
RETURN n.name, c.name

// Resource-based constrained delegation
MATCH (n)-[:AllowedToAct]->(c:Computer)
RETURN n.name, c.name
```

## Tier 0 Asset Mapping

```cypher
// All admincount=true accounts (approx. tier 0)
MATCH (n {admincount:true}) RETURN n.name, labels(n)

// Direct admin rights on DCs
MATCH p=(u:User)-[:AdminTo]->(c:Computer {name:$dc_name})
RETURN p
```

## High-Value Target Shortcuts

```cypher
// Foreign group members (cross-domain)
MATCH (u:User)-[:MemberOf]->(g:Group)
WHERE u.domain <> g.domain RETURN u.name, g.name

// Local admins on servers (excluding DCs)
MATCH p=(u:User)-[:AdminTo]->(c:Computer)
WHERE NOT c.name STARTS WITH "DC"
RETURN p LIMIT 50
```

> **Tip:** In BloodHound Community Edition, run custom queries via the "Custom Query" tab in the search panel. Save frequently used queries in the `customqueries.json` file for persistence.
