// src/config/site.ts
/**
 * Site configuration constants
 * These values are used across the application for consistency
 */

export const SITE_CONFIG = {
  name: 'DeepThought',
  title: 'DeepThought - Enterprise Management Platform',
  description: 'Streamline your organization\'s workflow with our powerful management system. Collaborate, manage, and grow your business efficiently with role-based access control, multi-organization support, and real-time collaboration tools.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://deepthought.education',
  logo: '/deepthought-logo.svg',
  themeColor: '#570df8',
} as const;
