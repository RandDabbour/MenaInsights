import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const RIYADH_IMG = "https://images.unsplash.com/photo-1738495888878-58190d59a6e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSaXlhZGglMjBTYXVkaSUyMEFyYWJpYSUyMGNpdHlzY2FwZXxlbnwxfHx8fDE3NzY1NTE4MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const CAIRO_IMG = "https://images.unsplash.com/photo-1774425329088-36801b6f09be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDYWlybyUyMEVneXB0JTIwY2l0eSUyMGFlcmlhbHxlbnwxfHx8fDE3NzY1NTE4MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const BEIRUT_IMG = "https://images.unsplash.com/photo-1717541378810-d06940c7e97b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCZWlydXQlMjBMZWJhbm9uJTIwTWVkaXRlcnJhbmVhbiUyMGNvYXN0fGVufDF8fHx8MTc3NjU1MTgzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const ISTANBUL_IMG = "https://images.unsplash.com/photo-1583014458773-7c633737edc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJc3RhbmJ1bCUyMFR1cmtleSUyMG1vc3F1ZSUyMHNreWxpbmV8ZW58MXx8fHwxNzc2NTUxODM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const DUBAI_IMG = "https://images.unsplash.com/photo-1773829126358-1e5f4e5aa532?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEdWJhaSUyMHNreWxpbmUlMjBtb2Rlcm4lMjBjaXR5c2NhcGV8ZW58MXx8fHwxNzc2NTUxODMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const PRESS_IMG = "https://images.unsplash.com/photo-1713948414133-c2cf74951e9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXdzcGFwZXIlMjBBcmFiaWMlMjBwcmVzcyUyMG1lZGlhfGVufDF8fHx8MTc3NjU1MTgzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const DEFAULT_SITE_CONTENT = {
  header: {
    brandLines: ["MIDDLE EAST", "MEDIA", "INSIGHTS"],
    navigation: [
      { name: "Home", href: "/", visible: true },
      { name: "Insights", href: "/insights", visible: true },
      { name: "Media Landscapes", href: "/media-landscapes", visible: true },
      { name: "Profiles", href: "/profiles", visible: true },
      { name: "Strategic Briefs", href: "/strategic-briefs", visible: true },
      { name: "About", href: "/about", visible: true },
      { name: "Contact", href: "/contact", visible: true },
    ],
    ctaText: "Request a Product",
    searchAriaLabel: "Search insights",
  },
  footer: {
    brandShort: "ME",
    brandName: "Middle East Media Insights",
    description: "Independent media analysis and strategic intelligence for the Middle East & North Africa region.",
    servicesTitle: "Services",
    servicesLinks: [
      { label: "Media Analysis", href: "/services", visible: true },
      { label: "Strategic Briefs", href: "/services", visible: true },
      { label: "Media Monitoring", href: "/services", visible: true },
      { label: "Landscape Reports", href: "/services", visible: true },
    ],
    resourcesTitle: "Resources",
    resourcesLinks: [
      { label: "Insights", href: "/insights", visible: true },
      { label: "Media Landscapes", href: "/media-landscapes", visible: true },
      { label: "Profiles", href: "/profiles", visible: true },
      { label: "Strategic Briefs", href: "/strategic-briefs", visible: true },
    ],
    connectTitle: "Connect",
    connectLinks: [
      { label: "About", href: "/about", visible: true },
      { label: "Contact", href: "/contact", visible: true },
      { label: "Request a Product", href: "/request-analysis", visible: true },
    ],
    social: {
      linkedinUrl: "https://www.linkedin.com/",
      twitterUrl: "https://x.com/",
      email: "hello@memi.me",
    },
    copyright: "© 2026 Middle East Media Insights. All rights reserved.",
    privacyLabel: "Privacy",
    termsLabel: "Terms",
  },
  pages: {
    homepage: {
      heroImage: "",
      heroAlt: "Middle East Media Insights hero",
      heroOverlay: {
        showText: false,
        title: "Middle East Media Insights",
        subtitle: "Independent media analysis and strategic intelligence for the MENA region.",
        imageOpacity: 100,
      },
      servicesIntro: {
        eyebrow: "What I Offer",
        title: "Request the intelligence you need",
        description:
          "Every report is produced on request and tailored to your specific needs. Choose a service below and I'll deliver actionable MENA media intelligence — usually within days.",
      },
      services: [
        {
          title: "Media Analysis",
          description: "Deep analysis of media ownership, editorial positioning, and influence patterns across MENA markets.",
          price: "From $350",
          cta: "Request",
        },
        {
          title: "Strategic Briefs",
          description: "Concise intelligence reports on specific topics, actors, or developments — tailored to your needs.",
          price: "From $250",
          cta: "Request",
        },
        {
          title: "Media Monitoring",
          description: "Ongoing tracking of narratives, sentiment shifts, and key actors across the region.",
          price: "From $800/mo",
          cta: "Request",
        },
        {
          title: "Landscape Reports",
          description: "Comprehensive mapping of a country's entire media ecosystem — ownership, regulation, key players.",
          price: "From $1,200",
          cta: "Request",
        },
      ],
      reportsIntro: {
        eyebrow: "Available Reports",
        title: "Ready-made intelligence",
        description:
          "Pre-produced reports available for immediate purchase. Need something custom? Request a tailored analysis instead.",
        viewAllLabel: "Explore services",
        showPrices: true,
      },
      reports: [
        {
          title: "GCC Media Consolidation & What It Means for Foreign Investors",
          category: "GCC",
          date: "April 15, 2026",
          image: RIYADH_IMG,
          price: "$450",
          cta: "Purchase report",
        },
        {
          title: "Mapping Influence Networks Across Levant Broadcasting",
          category: "Levant",
          date: "April 12, 2026",
          image: BEIRUT_IMG,
          price: "$380",
          cta: "Purchase report",
        },
        {
          title: "Egypt's Evolving Digital Media Regulation Landscape",
          category: "North Africa",
          date: "April 10, 2026",
          image: CAIRO_IMG,
          price: "$420",
          cta: "Purchase report",
        },
      ],
      coverage: {
        eyebrow: "Coverage",
        title: "Deep expertise across the MENA region",
        description:
          "I cover the full spectrum of MENA media — from the rapidly evolving GCC markets to the complex media environments of the Levant, North Africa, and beyond. Analysis is conducted in Arabic, English, Farsi, Turkish, French, Hebrew, Kurdish, and Urdu.",
        secondary:
          "Need a report on a specific country or topic? Request a custom analysis and I'll scope it for you with a quote.",
        cta: "Request a country-specific report",
        regions: [
          "Saudi Arabia",
          "UAE",
          "Qatar",
          "Kuwait",
          "Bahrain",
          "Oman",
          "Lebanon",
          "Jordan",
          "Iraq",
          "Iran",
          "Egypt",
          "Morocco",
          "Tunisia",
          "Turkey",
          "Cyprus",
        ],
        gallery: [
          { src: RIYADH_IMG, alt: "Riyadh" },
          { src: BEIRUT_IMG, alt: "Beirut" },
          { src: CAIRO_IMG, alt: "Cairo" },
        ],
      },
      cta: {
        title: "Need clarity on a MENA media question?",
        description:
          "Tell me what you need — whether it's a one-off brief, a landscape report, or ongoing monitoring. I'll scope it and send you a quote within 24 hours.",
        note: "No commitment required — you only pay once you're happy with the scope.",
        primaryLabel: "Request a Quote",
        secondaryLabel: "Explore Services",
      },
    },
    about: {
      heroImage: ISTANBUL_IMG,
      heroAlt: "MENA region",
      eyebrow: "About",
      title: "Behind Middle East Media Insights",
      introTitle: "Independent media intelligence, built on real expertise",
      introParagraphs: [
        "Middle East Media Insights is an independent consultancy providing media analysis and strategic intelligence focused exclusively on the MENA region. I founded it after over a decade working at the intersection of media, intelligence, and regional affairs.",
        "My background spans investigative journalism, strategic communications, and intelligence analysis across the Middle East. I've worked with government agencies, international organizations, corporations, and NGOs who needed to understand the media environments they were operating in — not just read headlines, but truly understand who controls the narrative and why.",
        "I work in Arabic, English, Farsi, Turkish, and French, and I monitor media across 15+ countries — from the rapidly modernizing GCC states to the complex and often opaque media landscapes of the Levant, North Africa, Iraq, Iran, and Turkey.",
        "Whether you need a one-off report on a specific media actor, an ongoing monitoring brief, or a comprehensive landscape assessment of an entire country's media ecosystem — I can help.",
      ],
      atGlanceTitle: "At a Glance",
      atGlanceItems: [
        { value: "12+", label: "Years of MENA experience" },
        { value: "15+", label: "Countries covered" },
        { value: "8", label: "Languages monitored" },
        { value: "500+", label: "Reports delivered" },
      ],
      valuesIntro: {
        eyebrow: "Why Work With Me",
        title: "What sets my work apart",
      },
      values: [
        {
          title: "Rigorous Verification",
          description: "Every finding is cross-checked across multiple sources. I don't publish anything I can't stand behind.",
        },
        {
          title: "Actionable, Not Academic",
          description: "My work is built to inform decisions — not just describe situations. You get clarity, not complexity.",
        },
        {
          title: "Native-Level Regional Knowledge",
          description: "I read, watch, and listen in Arabic and multiple regional languages — no relying on translations or secondary sources.",
        },
        {
          title: "Context That Matters",
          description: "Media doesn't exist in a vacuum. I connect media dynamics to politics, business, and regional power structures.",
        },
      ],
      regionFocusTitle: "Regional Focus",
      regionFocusItems: ["Gulf States (GCC)", "Levant Region", "North Africa", "Iraq & Iran", "Turkey & Cyprus"],
      thematicTitle: "Thematic Expertise",
      thematicItems: [
        "Media ownership & control",
        "Digital influence operations",
        "Political communication",
        "Regulatory environments",
        "Narrative analysis",
      ],
      methodologyTitle: "Methodologies",
      methodologyItems: [
        "Network analysis",
        "Content pattern recognition",
        "Multi-source verification",
        "Sentiment analysis",
        "Stakeholder mapping",
      ],
      cta: {
        title: "Interested in working together?",
        description:
          "Whether you have a specific question or want to explore how I can support your work in the region.",
        primaryLabel: "Request Analysis",
        secondaryLabel: "Get in Touch",
      },
    },
    insights: {
      eyebrow: "Research & Analysis",
      title: "Insights",
      description:
        "In-depth analysis of MENA media dynamics — from ownership shifts and influence operations to regulatory changes and digital transformation.",
      searchPlaceholder: "Search insights...",
      categories: ["All", "GCC", "Levant", "North Africa", "Turkey", "Digital Media"],
      items: [
        {
          title: "GCC Media Consolidation & What It Means for Foreign Investors",
          excerpt:
            "The Gulf's media sector is consolidating rapidly. I map the key deals, the players behind them, and what this restructuring signals for market entry.",
          date: "April 15, 2026",
          category: "GCC",
          readTime: "12 min read",
          image: RIYADH_IMG,
          href: "/request-analysis",
        },
        {
          title: "Mapping Influence Networks Across Levant Broadcasting",
          excerpt:
            "An analysis of cross-border media influence in Lebanon, Jordan, and Syria — who funds what, and how editorial lines shift with geopolitics.",
          date: "April 12, 2026",
          category: "Levant",
          readTime: "15 min read",
          image: BEIRUT_IMG,
          href: "/request-analysis",
        },
        {
          title: "Egypt's Evolving Digital Media Regulation Landscape",
          excerpt:
            "Cairo's new digital licensing framework is reshaping the online media space. Here's what organizations operating in Egypt need to know.",
          date: "April 10, 2026",
          category: "North Africa",
          readTime: "10 min read",
          image: CAIRO_IMG,
          href: "/request-analysis",
        },
        {
          title: "Turkey's Press Freedom Trajectory: A 2026 Assessment",
          excerpt:
            "Examining the current state of media independence in Turkey, including recent credential revocations and new regulations.",
          date: "April 8, 2026",
          category: "Turkey",
          readTime: "14 min read",
          image: ISTANBUL_IMG,
          href: "/request-analysis",
        },
        {
          title: "UAE's Soft Power Strategy Through Media Investment",
          excerpt:
            "How Abu Dhabi and Dubai are using media acquisitions and content investments to project influence across the Arab world and beyond.",
          date: "April 5, 2026",
          category: "GCC",
          readTime: "16 min read",
          image: DUBAI_IMG,
          href: "/request-analysis",
        },
        {
          title: "Arabic-Language Digital Influence Operations: Patterns and Detection",
          excerpt:
            "A methodological framework for identifying coordinated inauthentic behavior in Arabic-language social media — drawing on recent case studies.",
          date: "April 2, 2026",
          category: "Digital Media",
          readTime: "18 min read",
          image: PRESS_IMG,
          href: "/request-analysis",
        },
      ],
      readMoreLabel: "Read more",
      noResultsLabel: "No insights found matching your criteria.",
    },
    mediaLandscapes: {
      eyebrow: "Regional Coverage",
      title: "Media Landscapes",
      description:
        "Comprehensive mapping of MENA media ecosystems — ownership structures, regulatory environments, influence networks, and key players.",
      regions: [
        {
          name: "Gulf Cooperation Council (GCC)",
          description:
            "Media ecosystem mapping across Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman — including state-linked ownership and emerging digital platforms.",
          countries: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman"],
          image: RIYADH_IMG,
        },
        {
          name: "Levant Region",
          description: "Analysis of sectarian media dynamics, cross-border broadcasting influence, and diaspora media networks.",
          countries: ["Lebanon", "Jordan", "Syria", "Palestine"],
          image: BEIRUT_IMG,
        },
        {
          name: "North Africa",
          description:
            "Coverage of Egypt's rapidly consolidating media sector, Tunisia's press landscape, Morocco's digital transformation, and more.",
          countries: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya"],
          image: CAIRO_IMG,
        },
        {
          name: "Iraq & Iran",
          description: "Mapping media along sectarian lines in Iraq, and analyzing Iran's complex state and semi-independent media ecosystem.",
          countries: ["Iraq", "Iran"],
          image: "",
        },
        {
          name: "Turkey & Cyprus",
          description: "Turkey's evolving relationship between government and media, plus Northern Cyprus media dynamics.",
          countries: ["Turkey", "Northern Cyprus"],
          image: "",
        },
        {
          name: "Pan-Regional & Digital",
          description:
            "Cross-border broadcasters like Al Jazeera, MBC, and Sky News Arabia — plus pan-Arab digital platforms and social media trends.",
          countries: ["Al Jazeera", "MBC Group", "Sky News Arabia", "RT Arabic", "BBC Arabic"],
          image: "",
        },
      ],
      reportContents: {
        eyebrow: "Report Contents",
        title: "What a landscape report includes",
        items: [
          {
            title: "Ownership Mapping",
            desc: "Who owns what — corporate structures, political connections, and financial backers.",
          },
          { title: "Market Analysis", desc: "Audience reach, revenue models, and competitive dynamics." },
          { title: "Regulatory Environment", desc: "Legal frameworks, licensing requirements, and upcoming policy changes." },
          { title: "Key Stakeholders", desc: "Profiles of the people and entities that shape media in the market." },
          { title: "Strategic Assessment", desc: "What it all means for your objectives — risks, opportunities, and blind spots." },
        ],
      },
      requestCard: {
        title: "Request a Custom Report",
        description:
          "Need a landscape assessment for a specific country or sub-region? Send your request and you will receive a tailored proposal and delivery timeline.",
        pricingRows: [
          { label: "Pricing", value: "Quote provided after scoping" },
          { label: "Timeline", value: "Based on scope and priority" },
          { label: "Delivery", value: "Report PDF + optional briefing call" },
        ],
        cta: "Contact for Proposal",
      },
    },
    profiles: {
      eyebrow: "Intelligence on Key Actors",
      title: "Profiles",
      description:
        "Detailed intelligence on MENA media organizations, key individuals, and digital actors — the context you need to understand who's behind the narrative.",
      profileTypes: [
        {
          title: "Media Organizations",
          description:
            "Ownership structure, editorial positioning, revenue models, audience reach, and political alignment.",
          examples: ["Al Arabiya", "MBC Group", "Egypt's DMC channels", "Turkey's Demirören Media"],
        },
        {
          title: "Key Individuals",
          description:
            "Background, network connections, editorial influence, and public positioning of media decision-makers.",
          examples: ["Media owners", "Chief editors", "Government media advisors", "Regulatory officials"],
        },
        {
          title: "Digital Actors & Influencers",
          description:
            "Platform presence, audience analysis, content patterns, funding sources, and engagement metrics.",
          examples: ["Political commentators", "News aggregators", "Diaspora media figures", "State-linked accounts"],
        },
      ],
      sampleWork: {
        eyebrow: "Sample Work",
        title: "Recent profiles",
        items: [
          {
            type: "Media Organization",
            name: "MBC Group",
            region: "Pan-GCC",
            summary:
              "Comprehensive profile of the largest private media company in the Middle East — ownership shifts, content strategy, and regional influence.",
          },
          {
            type: "Key Individual",
            name: "Confidential — Government Media Advisor",
            region: "Gulf Region",
            summary:
              "Background analysis and network mapping of a senior figure shaping media policy in a GCC state.",
          },
          {
            type: "Media Organization",
            name: "Egyptian Digital News Landscape",
            region: "Egypt",
            summary:
              "Mapping the rise of state-aligned digital outlets and their impact on Egypt's independent media space.",
          },
          {
            type: "Digital Actor",
            name: "Arabic-Language Influence Network",
            region: "Multi-Region",
            summary:
              "Investigation into a coordinated social media network operating across platforms in Arabic — origins, reach, and messaging patterns.",
          },
        ],
      },
      cta: {
        title: "Need a profile on a specific actor?",
        description:
          "Whether it's a media organization, an individual, or a digital influence network — I can put together a comprehensive profile based on multi-source research and native-language analysis.",
        pricingRows: [
          { label: "Pricing", value: "Quote provided after request review" },
          { label: "Timeline", value: "Defined after scope confirmation" },
          { label: "Format", value: "Written profile + optional briefing call" },
        ],
        ctaLabel: "Contact for Proposal",
      },
      includes: {
        title: "What's included",
        items: [
          "Multi-source background research",
          "Ownership and financial connections",
          "Network and relationship mapping",
          "Content and editorial analysis",
          "Strategic assessment and implications",
          "Optional briefing call",
        ],
      },
    },
    services: {
      eyebrow: "What I Offer",
      title: "Services",
      description:
        "Tailored intelligence solutions for organizations and individuals navigating MENA media environments. Every engagement is scoped to your specific needs.",
      showPricing: false,
      priceHiddenLabel: "Quote provided after your request",
      cards: [
        {
          title: "Media Analysis",
          description:
            "Deep analysis of media ownership, editorial positioning, and influence patterns in specific MENA markets.",
          features: ["Media ownership mapping", "Influence network analysis", "Content pattern recognition", "Cross-platform monitoring"],
          pricing: "From $3,000",
        },
        {
          title: "Strategic Briefs",
          description:
            "Concise intelligence reports on specific topics, actors, or developments — tailored to your decision-making needs.",
          features: ["Executive summaries", "Deep-dive analysis", "Trend forecasting", "Actionable recommendations"],
          pricing: "From $2,500",
        },
        {
          title: "Media Monitoring",
          description:
            "Ongoing tracking of key narratives, actors, and sentiment shifts across MENA media markets.",
          features: ["Weekly digest reports", "Sentiment analysis", "Stakeholder tracking", "Alert notifications"],
          pricing: "From $1,500/month",
        },
        {
          title: "Landscape Reports",
          description:
            "Comprehensive assessment of a country or sub-region's entire media ecosystem — ownership, regulation, key players.",
          features: ["Stakeholder profiling", "Regulatory environment", "Market assessment", "Risk evaluation"],
          pricing: "From $5,000",
        },
        {
          title: "Actor Profiling",
          description:
            "Detailed profiles of media organizations, editors, influencers, or key decision-makers relevant to your work.",
          features: ["Background research", "Network mapping", "Content analysis", "Reach assessment"],
          pricing: "From $2,000",
        },
        {
          title: "Custom Research",
          description:
            "Bespoke intelligence projects designed around your unique requirements and strategic objectives in the region.",
          features: ["Flexible scope", "Multi-method approach", "Dedicated support", "Ongoing consultation"],
          pricing: "Contact for quote",
        },
      ],
      process: {
        eyebrow: "Process",
        title: "How it works",
        steps: [
          { step: "1", title: "You reach out", desc: "Submit a request or send me a message describing what you need." },
          { step: "2", title: "We scope it", desc: "I'll get back within 24 hours with questions, a proposal, and timeline." },
          { step: "3", title: "I do the work", desc: "Research, analysis, and writing — in the languages and markets that matter." },
          { step: "4", title: "You get the deliverable", desc: "Report delivered on time, with an optional briefing call to walk through findings." },
        ],
      },
      cta: {
        title: "Ready to get started?",
        description: "Tell me what you need and I'll put together a proposal within 24 hours.",
        label: "Request Analysis",
      },
      cardCtaLabel: "Request",
    },
    strategicBriefs: {
      eyebrow: "Actionable Intelligence",
      title: "Strategic Briefs",
      description:
        "Targeted intelligence reports built for decision-makers. Each brief answers a specific question about MENA media — clearly, concisely, and on deadline.",
      showPricing: false,
      priceHiddenLabel: "Quoted per request",
      briefTypes: [
        { title: "Rapid Response", description: "Fast-turnaround intelligence for time-sensitive situations or breaking developments in the region.", turnaround: "24-48 hours", price: "From $2,000" },
        { title: "Focused Analysis", description: "Deep-dive on a specific topic, actor, or market segment relevant to your work.", turnaround: "3-5 days", price: "From $2,500" },
        { title: "Trend Report", description: "Forward-looking analysis of emerging patterns and their strategic implications.", turnaround: "5-7 days", price: "From $3,500" },
        { title: "Comprehensive Brief", description: "Extensive research with multi-dimensional analysis and actionable recommendations.", turnaround: "1-2 weeks", price: "From $5,000" },
      ],
      includes: {
        eyebrow: "Every Brief Includes",
        title: "What you get",
        items: [
          { title: "Executive Summary", desc: "One-page overview for quick briefing." },
          { title: "Detailed Analysis", desc: "Thorough examination with evidence and sources." },
          { title: "Actionable Insights", desc: "Clear recommendations tied to your objectives." },
          { title: "Data Visualizations", desc: "Charts, network diagrams, and timelines." },
          { title: "Source Documentation", desc: "Full citations for transparency and verification." },
          { title: "Briefing Call", desc: "Optional 30-minute walkthrough of findings." },
        ],
      },
      sampleWork: {
        eyebrow: "Sample Work",
        title: "Recent briefs",
        items: [
          { title: "Saudi Media Regulator's New Digital Platform Rules", category: "Regulatory", excerpt: "Analysis of the new licensing framework and its impact on foreign digital media operations in the Kingdom.", pages: "14 pages" },
          { title: "Iranian State Media's Economic Narrative Shift", category: "Narrative Analysis", excerpt: "How Tehran's media apparatus is reframing coverage of economic reform — and what it signals about internal politics.", pages: "18 pages" },
          { title: "Lebanon's Media Fragmentation After the 2025 Elections", category: "Political Media", excerpt: "Mapping how political realignments reshaped media ownership and editorial positioning in Lebanon.", pages: "22 pages" },
          { title: "Qatar vs. UAE: Soft Power Through Media Investment", category: "Strategic Intelligence", excerpt: "Comparative analysis of how Doha and Abu Dhabi use media investments to project influence regionally and globally.", pages: "20 pages" },
        ],
      },
      cta: {
        title: "Need a brief on a specific topic?",
        description: "Tell me the question and I'll scope the work. Rush delivery available for time-sensitive needs.",
        label: "Request a Brief",
      },
    },
    contact: {
      submittedTitle: "Message sent",
      submittedDescription: "Thanks for getting in touch. I'll respond within one business day.",
      header: {
        eyebrow: "Let's Talk",
        title: "Contact",
        description:
          "Have a question, want to discuss a project, or just want to learn more about my work? I'd love to hear from you.",
      },
      infoTitle: "Get in touch",
      emailLabel: "Email",
      linkedinLabel: "LinkedIn",
      linkedinCta: "Connect on LinkedIn",
      channelsTitle: "Communication Channels",
      channels: [
        {
          label: "Email",
          value: "hello@memi.me",
          href: "mailto:hello@memi.me",
          type: "email",
          visible: true,
        },
        {
          label: "LinkedIn",
          value: "Connect on LinkedIn",
          href: "https://www.linkedin.com/",
          type: "linkedin",
          visible: true,
        },
      ],
      responseLabel: "Response Time",
      responseText: "Within 24 hours on business days",
      sidebarCard: {
        title: "Looking for a specific service?",
        description:
          "If you have a specific intelligence request, use the dedicated form — it helps me scope the work faster.",
        cta: "Request Analysis",
      },
      formTitle: "Send a message",
      fields: {
        name: "Name *",
        email: "Email *",
        subject: "Subject *",
        message: "Message *",
      },
      subjectOptions: [
        { label: "Select...", value: "" },
        { label: "General inquiry", value: "general" },
        { label: "Services information", value: "services" },
        { label: "Pricing question", value: "pricing" },
        { label: "Partnership / collaboration", value: "partnership" },
        { label: "Other", value: "other" },
      ],
      messagePlaceholder: "How can I help?",
      requiredLabel: "* Required",
      submitLabel: "Send Message",
    },
    requestAnalysis: {
      submittedTitle: "Request received",
      submittedDescription:
        "Thanks for reaching out. You will receive an email with your request portal link so you can return anytime.",
      openPortalLabel: "Open Request Portal",
      nextTitle: "What happens next:",
      nextSteps: [
        "Owner reviews your request details",
        "You receive a proposal update by email",
        "You can accept, reject, or negotiate in the portal",
        "If accepted, you can proceed to payment",
      ],
      backHomeLabel: "Back to Homepage",
      header: {
        eyebrow: "Get Started",
        title: "Request Analysis",
        description: "Tell me what you need — I'll get back to you within 24 hours with a proposal.",
      },
      contactTitle: "Contact Information",
      projectTitle: "Project Details",
      labels: {
        fullName: "Full Name *",
        email: "Email *",
        organization: "Organization (if applicable)",
        service: "Service Type *",
        timeline: "Timeline *",
        region: "Region / Country of Interest *",
        topic: "Topic / Focus *",
        description: "Description *",
        budget: "Budget Range (optional)",
      },
      showBudgetField: false,
      placeholders: {
        region: "e.g., Saudi Arabia, Levant region, GCC",
        topic: "e.g., media ownership in Qatar, digital influence in Iraq",
        description: "Describe what you need, any specific questions you want answered, and relevant context...",
      },
      serviceOptions: [
        { label: "Select...", value: "" },
        { label: "Media Analysis", value: "media-analysis" },
        { label: "Strategic Brief", value: "strategic-brief" },
        { label: "Media Monitoring", value: "media-monitoring" },
        { label: "Landscape Report", value: "landscape-report" },
        { label: "Actor Profiling", value: "actor-profiling" },
        { label: "Custom Research", value: "custom" },
      ],
      urgencyOptions: [
        { label: "Select...", value: "" },
        { label: "Standard (1-2 weeks)", value: "standard" },
        { label: "Rush (48-72 hours)", value: "rush" },
        { label: "Urgent (within 24 hours)", value: "urgent" },
      ],
      budgetOptions: [
        { label: "Select...", value: "" },
        { label: "Under $3,000", value: "under-3k" },
        { label: "$3,000 - $5,000", value: "3k-5k" },
        { label: "$5,000 - $10,000", value: "5k-10k" },
        { label: "$10,000+", value: "10k-plus" },
        { label: "Flexible", value: "flexible" },
      ],
      requiredText: "* Required fields",
      submitLabel: "Submit Request",
      submittingLabel: "Submitting...",
    },
    privacy: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      description:
        "How Middle East Media Insights handles and protects information shared by clients and visitors.",
      sections: [
        {
          title: "Information You Share",
          body:
            "We collect only the information needed to respond to inquiries, scope projects, and deliver requested work. This can include your name, email, organization, and project details.",
        },
        {
          title: "How Information Is Used",
          body:
            "Information is used for communication, project delivery, and service improvement. We do not sell personal information to third parties.",
        },
        {
          title: "Data Security",
          body:
            "Reasonable technical and organizational safeguards are used to protect submitted information from unauthorized access, loss, or misuse.",
        },
      ],
    },
    terms: {
      eyebrow: "Legal",
      title: "Terms of Service",
      description:
        "Core terms governing use of this website and engagement for analysis and consulting services.",
      sections: [
        {
          title: "Service Scope",
          body: "Work is delivered according to the agreed scope, timeline, and format defined in each confirmed request.",
        },
        {
          title: "Intellectual Property",
          body:
            "Final deliverables are licensed as agreed in writing. Background methods, frameworks, and internal processes remain the property of Middle East Media Insights.",
        },
        {
          title: "Liability",
          body:
            "Insights and analysis are provided for informational and strategic decision-support purposes and are not legal or financial advice.",
        },
      ],
    },
  },
} as const;

export type SiteContent = typeof DEFAULT_SITE_CONTENT;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (typeof base === "string") {
    return (typeof override === "string" ? override : base) as T;
  }

  if (typeof base === "number" || typeof base === "boolean" || base === null) {
    return ((override ?? base) as T);
  }

  if (Array.isArray(base)) {
    if (!Array.isArray(override)) {
      return base as T;
    }

    // Preserve admin-managed list length exactly as saved.
    // If an admin deletes items, defaults should not re-appear.
    return override.map((item, index) => {
      if (index < base.length) {
        return deepMerge(base[index], item);
      }
      return item;
    }) as T;
  }

  if (!isPlainObject(base)) {
    return base;
  }

  const result: Record<string, unknown> = {};
  const overrideObj = isPlainObject(override) ? override : {};
  for (const key of Object.keys(base)) {
    result[key] = deepMerge((base as Record<string, unknown>)[key], overrideObj[key]);
  }

  for (const key of Object.keys(overrideObj)) {
    if (!(key in result)) {
      result[key] = overrideObj[key];
    }
  }

  return result as T;
}

export function mergeSiteContent(override: unknown): SiteContent {
  return deepMerge(DEFAULT_SITE_CONTENT, override);
}

type SiteContentContextValue = {
  siteContent: SiteContent;
  refreshSiteContent: () => Promise<void>;
};

const SiteContentContext = createContext<SiteContentContextValue>({
  siteContent: DEFAULT_SITE_CONTENT,
  refreshSiteContent: async () => {},
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  const refreshSiteContent = async () => {
    try {
      const response = await fetch("/api/content");
      const payload = await response.json();
      if (!response.ok) {
        return;
      }

      const mergedContent = mergeSiteContent(payload?.content?.siteContent || {});
      const legacyHeroImage = String(payload?.content?.homepage?.heroImage || "").trim();
      const legacyHeroAlt = String(payload?.content?.homepage?.heroAlt || "").trim();

      const withLegacyHero: SiteContent = {
        ...mergedContent,
        pages: {
          ...mergedContent.pages,
          homepage: {
            ...mergedContent.pages.homepage,
            heroImage: legacyHeroImage || mergedContent.pages.homepage.heroImage,
            heroAlt: legacyHeroAlt || mergedContent.pages.homepage.heroAlt,
          },
        },
      };

      setSiteContent(withLegacyHero);
    } catch {
      // Keep local defaults if backend is unavailable.
    }
  };

  useEffect(() => {
    refreshSiteContent();
  }, []);

  const value = useMemo(() => ({ siteContent, refreshSiteContent }), [siteContent]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
