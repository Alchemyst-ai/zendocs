import mongoose from 'mongoose';
import Doc from '../src/models/doc';

const MONGODB_URL = "mongodb+srv://competitivecoder69:16041604@alchemystai.ngmfq.mongodb.net/";
const DB_NAME = "zendocs";

async function insertTestDocs() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL, {
      dbName: DB_NAME
    });
    console.log('Connected successfully! to the database ', DB_NAME, ' at ', MONGODB_URL);

    // First Document (Technical) with children
    // Function to create unique slug
function createUniqueSlug(baseSlug: string): string {
  return `${baseSlug}-${Date.now()}`;
}

const techDoc = await Doc.create({
      title: "System Architecture Guide",
      name: createUniqueSlug("system-architecture"),
      description: "Complete guide to our system architecture and components",
      content: `# System Architecture Guide
      
Our system is built with scalability and maintainability in mind. This guide covers all major components.

## Overview
- Microservices Architecture
- Data Flow
- Security Measures
      `,
      slug: createUniqueSlug("system-architecture"),
      authors: ["Sarah Tech"],
      tags: ["architecture", "technical", "guide"],
      children: [], // Will be populated after creating children
      metadata: {
        timestamp: Date.now(),
        isUserGenerated: true,
        category: "Technical"
      }
    });

    // Children for Tech Doc
    const techChildren = await Promise.all([
      Doc.create({
        title: "Database Design",
        name: createUniqueSlug("database-design"),
        description: "Detailed database schema and relationships",
        content: `# Database Design
        
Our database architecture uses MongoDB for flexibility and scalability.

## Schema Design
- User Collections
- Document Relations
- Indexing Strategy`,
        slug: createUniqueSlug("database-design"),
        authors: ["Sarah Tech"],
        tags: ["database", "mongodb", "technical"],
        children: [],
        metadata: {
          timestamp: Date.now(),
          isUserGenerated: true
        }
      }),
      Doc.create({
        title: "API Documentation",
        name: createUniqueSlug("api-documentation"),
        description: "API endpoints and usage guidelines",
        content: `# API Documentation
        
Complete guide to our REST API endpoints.

## Authentication
- JWT Token Usage
- Rate Limiting
- Error Handling`,
        slug: createUniqueSlug("api-documentation"),
        authors: ["Sarah Tech"],
        tags: ["api", "rest", "documentation"],
        children: [],
        metadata: {
          timestamp: Date.now(),
          isUserGenerated: true
        }
      })
    ]);

    // Update tech doc with children
    techDoc.children = techChildren.map(child => child._id.toString());
    await techDoc.save();

    // Second Document (Marketing) with children
    const marketingDoc = await Doc.create({
      title: "Marketing Campaign Playbook",
      name: createUniqueSlug("marketing-playbook"),
      description: "Strategic guide for running successful marketing campaigns",
      content: `# Marketing Campaign Playbook
      
This playbook provides guidelines for planning and executing marketing campaigns.

## Campaign Planning
- Target Audience Analysis
- Channel Selection
- Budget Allocation`,
      slug: createUniqueSlug("marketing-playbook"),
      authors: ["Mike Marketing"],
      tags: ["marketing", "strategy", "campaigns"],
      children: [], // Will be populated after creating children
      metadata: {
        timestamp: Date.now(),
        isUserGenerated: true,
        category: "Marketing"
      }
    });

    // Children for Marketing Doc
    const marketingChildren = await Promise.all([
      Doc.create({
        title: "Social Media Strategy",
        name: createUniqueSlug("social-media-strategy"),
        description: "Detailed social media marketing guidelines",
        content: `# Social Media Strategy
        
Effective social media engagement strategies for our brand.

## Platform Strategy
- Twitter Engagement
- LinkedIn Content
- Instagram Stories`,
        slug: createUniqueSlug("social-media-strategy"),
        authors: ["Mike Marketing"],
        tags: ["social-media", "marketing"],
        children: [],
        metadata: {
          timestamp: Date.now(),
          isUserGenerated: true
        }
      }),
      Doc.create({
        title: "Email Marketing Guide",
        name: createUniqueSlug("email-marketing"),
        description: "Best practices for email marketing campaigns",
        content: `# Email Marketing Guide
        
Comprehensive guide to running successful email campaigns.

## Key Components
- List Segmentation
- A/B Testing
- Content Personalization`,
        slug: createUniqueSlug("email-marketing"),
        authors: ["Mike Marketing"],
        tags: ["email", "marketing", "campaigns"],
        children: [],
        metadata: {
          timestamp: Date.now(),
          isUserGenerated: true
        }
      })
    ]);

    // Update marketing doc with children
    marketingDoc.children = marketingChildren.map(child => child._id.toString());
    await marketingDoc.save();

    console.log('Successfully created documents:');
    console.log('1. Technical Documents:');
    console.log('   - Parent:', techDoc.title);
    console.log('   - Children:', techChildren.map(doc => doc.title).join(', '));
    console.log('2. Marketing Documents:');
    console.log('   - Parent:', marketingDoc.title);
    console.log('   - Children:', marketingChildren.map(doc => doc.title).join(', '));

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
insertTestDocs();
