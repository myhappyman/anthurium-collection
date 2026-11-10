export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Visibility = "private" | "unlisted" | "public";
type CatalogNodeKind = "species" | "selection" | "hybrid";
type GenotypeKind =
  | "species"
  | "named_clone"
  | "hybrid"
  | "selfed_seedling"
  | "cross_seedling"
  | "selected_seedling"
  | "reference_only"
  | "unknown";
type ProvenanceGrade = "A" | "B" | "C" | "D" | "U";
type SpecimenStatus =
  | "active"
  | "reserved"
  | "listed"
  | "sold"
  | "transferred"
  | "consumed"
  | "died"
  | "lost";
type PropagationMethod =
  | "seed"
  | "offset"
  | "division"
  | "stem_cut"
  | "tissue_culture";
type CrossStatus =
  | "planned"
  | "pollinated"
  | "developing"
  | "harvested"
  | "germinating"
  | "completed"
  | "failed"
  | "cancelled";
type EventKind =
  | "acquired"
  | "repotted"
  | "relocated"
  | "renamed"
  | "identified"
  | "flowered"
  | "pollen_collected"
  | "pollinated"
  | "seed_harvested"
  | "germinated"
  | "propagated"
  | "selected"
  | "listed"
  | "sold"
  | "transferred"
  | "died"
  | "corrected"
  | "status_changed"
  | "lost";

type ProfilesTable = {
  Row: {
    id: string;
    handle: string;
    display_name: string;
    bio: string | null;
    avatar_path: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    handle: string;
    display_name: string;
    bio?: string | null;
    avatar_path?: string | null;
    is_public?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ProfilesTable["Insert"]>;
  Relationships: [];
};

type CatalogNodesTable = {
  Row: {
    id: string;
    owner_id: string | null;
    legacy_slug: string;
    display_name: string;
    scientific_name: string | null;
    kind: CatalogNodeKind;
    abbreviations: string[];
    aliases: string[];
    description_ko: string | null;
    traits: Json;
    tags: string[];
    source_urls: string[];
    is_verified: boolean;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    owner_id?: string | null;
    legacy_slug: string;
    display_name: string;
    scientific_name?: string | null;
    kind: CatalogNodeKind;
    abbreviations?: string[];
    aliases?: string[];
    description_ko?: string | null;
    traits?: Json;
    tags?: string[];
    source_urls?: string[];
    is_verified?: boolean;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<CatalogNodesTable["Insert"]>;
  Relationships: [];
};

type CatalogEdgesTable = {
  Row: {
    id: string;
    parent_node_id: string;
    child_node_id: string;
    relation_kind: "cross" | "selection";
    parent_role: "seed" | "pollen" | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    parent_node_id: string;
    child_node_id: string;
    relation_kind: "cross" | "selection";
    parent_role?: "seed" | "pollen" | null;
    created_at?: string;
  };
  Update: Partial<CatalogEdgesTable["Insert"]>;
  Relationships: [];
};

type GenotypesTable = {
  Row: {
    id: string;
    owner_id: string;
    catalog_node_id: string | null;
    origin_cross_id: string | null;
    code: string;
    display_name: string;
    kind: GenotypeKind;
    generation: string | null;
    breeder_name: string | null;
    provenance_grade: ProvenanceGrade;
    provenance_notes: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    owner_id: string;
    catalog_node_id?: string | null;
    origin_cross_id?: string | null;
    code: string;
    display_name: string;
    kind: GenotypeKind;
    generation?: string | null;
    breeder_name?: string | null;
    provenance_grade?: ProvenanceGrade;
    provenance_notes?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<GenotypesTable["Insert"]>;
  Relationships: [];
};

type CrossesTable = {
  Row: {
    id: string;
    owner_id: string;
    code: string;
    seed_parent_genotype_id: string | null;
    pollen_parent_genotype_id: string | null;
    generation: string | null;
    status: CrossStatus;
    pollinated_at: string | null;
    harvested_at: string | null;
    seed_count: number | null;
    germinated_count: number | null;
    notes: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    owner_id: string;
    code: string;
    seed_parent_genotype_id?: string | null;
    pollen_parent_genotype_id?: string | null;
    generation?: string | null;
    status?: CrossStatus;
    pollinated_at?: string | null;
    harvested_at?: string | null;
    seed_count?: number | null;
    germinated_count?: number | null;
    notes?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<CrossesTable["Insert"]>;
  Relationships: [];
};

type SpecimensTable = {
  Row: {
    id: string;
    owner_id: string;
    genotype_id: string;
    code: string;
    propagation_method: PropagationMethod;
    status: SpecimenStatus;
    acquired_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    owner_id: string;
    genotype_id: string;
    code: string;
    propagation_method: PropagationMethod;
    status?: SpecimenStatus;
    acquired_at?: string | null;
    started_at?: string | null;
    ended_at?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<SpecimensTable["Insert"]>;
  Relationships: [];
};

type PropagationEventsTable = {
  Row: {
    id: string;
    owner_id: string;
    genotype_id: string;
    source_specimen_id: string;
    target_specimen_id: string;
    method: PropagationMethod;
    propagated_at: string;
    notes: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    genotype_id: string;
    source_specimen_id: string;
    target_specimen_id: string;
    method: PropagationMethod;
    propagated_at: string;
    notes?: string | null;
    created_at?: string;
  };
  Update: Partial<PropagationEventsTable["Insert"]>;
  Relationships: [];
};

type ActivityEventsTable = {
  Row: {
    id: string;
    owner_id: string;
    genotype_id: string | null;
    specimen_id: string | null;
    cross_id: string | null;
    kind: EventKind;
    occurred_at: string;
    notes: string | null;
    metadata: Json;
    corrects_event_id: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    genotype_id?: string | null;
    specimen_id?: string | null;
    cross_id?: string | null;
    kind: EventKind;
    occurred_at: string;
    notes?: string | null;
    metadata?: Json;
    corrects_event_id?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
  };
  Update: Partial<ActivityEventsTable["Insert"]>;
  Relationships: [];
};

type ObservationsTable = {
  Row: {
    id: string;
    owner_id: string;
    specimen_id: string;
    observed_at: string;
    leaf_sequence: number | null;
    leaf_length_mm: number | null;
    leaf_width_mm: number | null;
    petiole_length_mm: number | null;
    internode_length_mm: number | null;
    emergent_color: string | null;
    mature_color: string | null;
    vein_description: string | null;
    sinus_description: string | null;
    texture: string | null;
    vigor: number | null;
    notes: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    specimen_id: string;
    observed_at: string;
    leaf_sequence?: number | null;
    leaf_length_mm?: number | null;
    leaf_width_mm?: number | null;
    petiole_length_mm?: number | null;
    internode_length_mm?: number | null;
    emergent_color?: string | null;
    mature_color?: string | null;
    vein_description?: string | null;
    sinus_description?: string | null;
    texture?: string | null;
    vigor?: number | null;
    notes?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ObservationsTable["Insert"]>;
  Relationships: [];
};

type TransactionsTable = {
  Row: {
    id: string;
    owner_id: string;
    specimen_id: string;
    kind: "purchase" | "sale" | "gift_received" | "gift_sent" | "trade";
    transacted_at: string;
    counterparty: string | null;
    amount: number | null;
    currency: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    specimen_id: string;
    kind: TransactionsTable["Row"]["kind"];
    transacted_at: string;
    counterparty?: string | null;
    amount?: number | null;
    currency?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<TransactionsTable["Insert"]>;
  Relationships: [];
};

type MediaTable = {
  Row: {
    id: string;
    owner_id: string;
    genotype_id: string | null;
    specimen_id: string | null;
    cross_id: string | null;
    observation_id: string | null;
    kind:
      | "plant"
      | "leaf"
      | "inflorescence"
      | "pollen"
      | "seed"
      | "provenance"
      | "receipt"
      | "other";
    bucket_id: string;
    object_path: string;
    captured_at: string | null;
    alt_text: string | null;
    caption: string | null;
    visibility: Visibility;
    published_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    genotype_id?: string | null;
    specimen_id?: string | null;
    cross_id?: string | null;
    observation_id?: string | null;
    kind: MediaTable["Row"]["kind"];
    bucket_id: string;
    object_path: string;
    captured_at?: string | null;
    alt_text?: string | null;
    caption?: string | null;
    visibility?: Visibility;
    published_at?: string | null;
    created_at?: string;
  };
  Update: Partial<MediaTable["Insert"]>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: ProfilesTable;
      catalog_nodes: CatalogNodesTable;
      catalog_edges: CatalogEdgesTable;
      genotypes: GenotypesTable;
      crosses: CrossesTable;
      specimens: SpecimensTable;
      propagation_events: PropagationEventsTable;
      activity_events: ActivityEventsTable;
      observations: ObservationsTable;
      media: MediaTable;
      transactions: TransactionsTable;
    };
    Views: Record<string, never>;
    Functions: {
      create_clonal_specimen: {
        Args: {
          source_specimen_id: string;
          target_code: string;
          propagation_method:
            | "offset"
            | "division"
            | "stem_cut"
            | "tissue_culture";
          propagated_at: string;
          target_visibility?: Visibility;
          propagation_notes?: string | null;
          consume_source?: boolean;
        };
        Returns: string;
      };
      create_cross_seedling: {
        Args: {
          source_cross_id: string;
          genotype_code: string;
          genotype_display_name: string;
          specimen_code: string;
          germinated_at: string;
          provenance_grade?: ProvenanceGrade;
          target_visibility?: Visibility;
        };
        Returns: string;
      };
      record_specimen_status_change: {
        Args: {
          target_specimen_id: string;
          target_status: SpecimenStatus;
          occurred_on: string;
          change_notes?: string | null;
          related_transaction_kind?:
            | "purchase"
            | "sale"
            | "gift_received"
            | "gift_sent"
            | "trade"
            | null;
          transaction_counterparty?: string | null;
          transaction_amount?: number | null;
          transaction_currency?: string | null;
        };
        Returns: string;
      };
      restore_collection_backup: {
        Args: {
          backup_data: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      visibility: Visibility;
      catalog_node_kind: CatalogNodeKind;
      genotype_kind: GenotypeKind;
      provenance_grade: ProvenanceGrade;
      specimen_status: SpecimenStatus;
      propagation_method: PropagationMethod;
      cross_status: CrossStatus;
      event_kind: EventKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
