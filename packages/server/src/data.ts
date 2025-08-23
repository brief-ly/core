// Types
export interface Lawyer {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  avatar: string;
  description: string;
  responseTime: string;
  isTeam: boolean;
  teamSize?: number;
  isVerified: boolean;
  completedCases: number;
  // Profile-specific fields
  yearsExperience: number;
  education: string[];
  languages: string[];
  availability: 'Available' | 'Busy' | 'Away';
  consultationFee: number;
  aboutMe?: string;
  certifications: string[];
  caseResults: string[];
  testimonials: {
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    date: string;
    caseType: string;
  }[];
}

export interface SearchResultsProps {
  results: Lawyer[];
  isLoading: boolean;
  searchQuery: string;
  onContactLawyer: (lawyerId: string) => void;
  className?: string;
}

export interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  onClear: () => void;
  currentQuery?: string;
  className?: string;
}

// Mock Data
export const mockLawyers: Lawyer[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Contract & Business Law Specialist",
    location: "San Francisco, CA",
    rating: 4.9,
    reviewCount: 127,
    specialties: ["Contract Law", "Business Formation", "Negotiations"],
    avatar: "SC",
    description: "15+ years helping startups and established businesses navigate complex contracts and business law matters.",
    responseTime: "Usually responds within 2 hours",
    isTeam: false,
    isVerified: true,
    completedCases: 340,
    yearsExperience: 15,
    education: ["JD, Stanford Law School", "MBA, UC Berkeley Haas"],
    languages: ["English", "Mandarin", "Spanish"],
    availability: "Available",
    consultationFee: 150,
    aboutMe: "With over 15 years of experience in contract and business law, I've helped hundreds of startups and established businesses navigate complex legal challenges. My approach combines deep legal expertise with practical business insights to deliver solutions that protect my clients' interests while enabling their growth.",
    certifications: ["California State Bar", "Business Law Specialist Certification"],
    caseResults: [
      "Successfully negotiated $50M acquisition deal for tech startup",
      "Resolved contract dispute saving client $2.3M in potential damages",
      "Helped 200+ businesses with formation and compliance"
    ],
    testimonials: [
      {
        id: "t1",
        clientName: "Jennifer Walsh",
        rating: 5,
        comment: "Sarah helped us navigate a complex contract dispute with amazing results. Her expertise and communication were exceptional.",
        date: "2024-01-15",
        caseType: "Contract Dispute"
      },
      {
        id: "t2", 
        clientName: "TechStart Inc.",
        rating: 5,
        comment: "Outstanding legal counsel for our business formation. Sarah made the process smooth and explained everything clearly.",
        date: "2024-02-03",
        caseType: "Business Formation"
      }
    ]
  },
  {
    id: "2",
    name: "Corporate Legal Team",
    title: "Full-Service Business Law Team",
    location: "New York, NY",
    rating: 4.8,
    reviewCount: 89,
    specialties: ["Corporate Law", "M&A", "Securities", "Compliance"],
    avatar: "CLT",
    description: "Premier corporate law team with expertise in mergers, acquisitions, and complex business transactions.",
    responseTime: "Usually responds within 1 hour",
    isTeam: true,
    teamSize: 5,
    isVerified: true,
    completedCases: 210,
    yearsExperience: 12,
    education: ["Harvard Law School", "Columbia Business School", "NYU Law"],
    languages: ["English", "French", "German"],
    availability: "Available",
    consultationFee: 200,
    aboutMe: "Our elite corporate legal team brings together decades of combined experience in handling the most complex business transactions. We specialize in M&A, securities law, and corporate compliance for Fortune 500 companies and emerging growth companies.",
    certifications: ["New York State Bar", "Securities Law Specialist", "M&A Expert Certification"],
    caseResults: [
      "Led $1.2B merger transaction for Fortune 500 company",
      "Successful IPO guidance for 15+ companies",
      "Resolved SEC compliance issues for multiple public companies"
    ],
    testimonials: [
      {
        id: "t3",
        clientName: "GlobalTech Corp",
        rating: 5,
        comment: "Exceptional team that handled our complex merger flawlessly. Their expertise in securities law is unmatched.",
        date: "2023-12-10",
        caseType: "M&A Transaction"
      }
    ]
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    title: "Employment & Labor Law Attorney",
    location: "Austin, TX",
    rating: 4.7,
    reviewCount: 156,
    specialties: ["Employment Law", "Labor Disputes", "HR Compliance"],
    avatar: "MR",
    description: "Dedicated employment attorney protecting both employers and employees in workplace legal matters.",
    responseTime: "Usually responds within 4 hours",
    isTeam: false,
    isVerified: true,
    completedCases: 445,
    yearsExperience: 18,
    education: ["JD, University of Texas School of Law", "LLM, Georgetown University Law Center"],
    languages: ["English", "Spanish"],
    availability: "Busy",
    consultationFee: 125,
    aboutMe: "For nearly two decades, I've been at the forefront of employment and labor law, representing both employers and employees in complex workplace disputes. My balanced approach ensures fair outcomes while protecting the rights and interests of all parties involved.",
    certifications: ["Texas State Bar", "Employment Law Specialist", "Labor Relations Certification"],
    caseResults: [
      "Won $4.5M settlement in major employment discrimination case",
      "Successfully defended employer in class action wage dispute",
      "Negotiated favorable settlements in 95% of cases"
    ],
    testimonials: [
      {
        id: "t4",
        clientName: "Maria Santos",
        rating: 5,
        comment: "Michael fought tirelessly for my employment rights. His knowledge and dedication were incredible.",
        date: "2024-01-28",
        caseType: "Employment Discrimination"
      },
      {
        id: "t5",
        clientName: "Austin Manufacturing Co.",
        rating: 4,
        comment: "Great counsel on our HR compliance matters. Very thorough and professional.",
        date: "2023-11-15",
        caseType: "HR Compliance"
      }
    ]
  }
];

// Helper function to simulate API search
export const searchLawyers = async (query: string): Promise<Lawyer[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, this would filter based on the query
  // For now, return all mock data
  return mockLawyers;
};

// Helper function to get lawyer by ID
export const getLawyerById = async (id: string): Promise<Lawyer | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return mockLawyers.find(lawyer => lawyer.id === id) || null;
};
