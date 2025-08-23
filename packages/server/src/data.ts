// API Response Types


export interface ApiLawyer {
  accountId: string;
  relevanceScore: number;
  roleInGroup: string;
  // Full lawyer data from database
  name: string;
  photoUrl: string;
  bio: string;
  expertise: string;
  jurisdictions: string[];
  labels: string[];
  consultationFee: number;
  nftTokenId: number | null;
  verifiedAt: string | null;
}

export interface ApiGroup {
  groupName: string;
  lawyers: ApiLawyer[];
  reasoning: string;
  groupId: number;
}

export interface ApiSearchQuery {
  currentSituation: string;
  futurePlans: string;
}

export interface ApiSearchResponse {
  groups: ApiGroup[];
  totalLawyers: number;
  query: ApiSearchQuery;
}



export interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  onClear: () => void;
  currentQuery?: string;
  className?: string;
}
