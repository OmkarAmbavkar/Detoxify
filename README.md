# Detoxify
Detoxify – YouTube Feed Realignment Tool
Overview

Detoxify is a web based application designed to help users regain control over their YouTube recommendations. The tool allows users to shift their YouTube feed toward educational or productive content by generating topic based playlists and influencing recommendation behavior through automation.

The goal of Detoxify is to reduce distraction caused by algorithm driven content and help users consciously realign what they consume on YouTube.

Problem Statement

YouTube’s recommendation algorithm often prioritizes watch time over user intent. As a result, users are frequently exposed to distracting or non productive content even when they want to focus on learning or self improvement.

Manually changing recommendations is time consuming and inconsistent. Detoxify aims to solve this problem by programmatically guiding the recommendation system toward user selected topics.

Solution

Detoxify provides a simple interface where users choose topics they want to focus on. The application fetches relevant videos using the YouTube Data API and creates curated playlists. Automation is then used to simulate interaction with this content, helping realign future recommendations.

Key Features

Topic based video selection

Personalized playlist generation

Integration with YouTube Data API v3

Automation using Puppeteer to influence recommendations

Clean and responsive user interface

Backend processing of user preferences

Tech Stack
Frontend

HTML

CSS

JavaScript

Backend

Node.js

APIs and Tools

YouTube Data API v3

Puppeteer

How the Application Works

The user selects one or more topics they want to focus on

The backend fetches relevant videos related to those topics using the YouTube Data API

A personalized playlist is generated

Puppeteer automation simulates viewing behavior to influence YouTube’s recommendation algorithm

Installation and Setup

Clone the repository to your local system

Install Node.js if it is not already installed

Install required dependencies using npm

Create a YouTube Data API key from Google Developer Console

Add the API key to environment variables

Run the application using Node.js

Use Cases

Students who want educational recommendations

Professionals trying to reduce content distractions

Users who want mindful control over online content consumption

Learning Outcomes

Practical experience with REST API integration

Hands on exposure to web automation

Backend logic development using Node.js

Understanding of recommendation systems and system design

Improved problem solving and implementation skills

Future Enhancements

User authentication and saved preferences

Recommendation progress tracking

Analytics dashboard for content consumption

Browser extension version of Detoxify

Author

Omkar Ambavkar
