


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'RLS properly configured for development - ready for production with minor changes';



CREATE OR REPLACE FUNCTION "public"."can_access_marba_uvp"("p_brand_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.brands
        WHERE id = p_brand_id
        AND user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."can_access_marba_uvp"("p_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_intelligence_cache"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM intelligence_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_intelligence_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_brand_for_dashboard"("p_brand_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "industry" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.industry,
    b.created_at,
    b.updated_at,
    b.data
  FROM brands b
  WHERE b.id = p_brand_id;
END;
$$;


ALTER FUNCTION "public"."get_brand_for_dashboard"("p_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_intelligence_cache"("p_cache_key" "text") RETURNS TABLE("id" "uuid", "cache_key" "text", "data" "jsonb", "created_at" timestamp with time zone, "expires_at" timestamp with time zone, "brand_id" "uuid", "data_type" "text", "source_api" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ic.id,
    ic.cache_key,
    ic.data,
    ic.created_at,
    ic.expires_at,
    ic.brand_id,
    ic.data_type,
    ic.source_api,
    ic.updated_at
  FROM intelligence_cache ic
  WHERE ic.cache_key = p_cache_key
    AND ic.expires_at > NOW()  -- Only return non-expired cache
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_intelligence_cache"("p_cache_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_location_cache"("p_domain" "text") RETURNS TABLE("city" "text", "state" "text", "confidence" numeric, "method" "text", "reasoning" "text", "hasmultiplelocations" boolean, "alllocations" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ldc.city,
    ldc.state,
    ldc.confidence,
    ldc.method,
    ldc.reasoning,
    ldc.hasMultipleLocations,
    ldc.allLocations
  FROM location_detection_cache ldc
  WHERE ldc.domain = p_domain
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_location_cache"("p_domain" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_marba_uvps_for_dashboard"("p_brand_id" "uuid") RETURNS TABLE("id" "uuid", "brand_id" "uuid", "uvp_data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.brand_id,
    m.uvp_data,
    m.created_at,
    m.updated_at
  FROM marba_uvps m
  WHERE m.brand_id = p_brand_id
  ORDER BY m.created_at DESC
  LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_marba_uvps_for_dashboard"("p_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_location_cache"("p_domain" "text", "p_city" "text", "p_state" "text", "p_confidence" double precision DEFAULT 0.5, "p_method" "text" DEFAULT 'website_scraping'::"text", "p_reasoning" "text" DEFAULT NULL::"text", "p_has_multiple" boolean DEFAULT false, "p_all_locations" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO location_detection_cache (
        domain,
        city,
        state,
        confidence,
        method,
        reasoning,
        has_multiple_locations,  -- snake_case!
        all_locations,           -- snake_case!
        created_at,
        updated_at
    )
    VALUES (
        p_domain,
        p_city,
        p_state,
        p_confidence,
        p_method,
        p_reasoning,
        p_has_multiple,
        p_all_locations,
        NOW(),
        NOW()
    )
    ON CONFLICT (domain)
    DO UPDATE SET
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        confidence = EXCLUDED.confidence,
        method = EXCLUDED.method,
        reasoning = EXCLUDED.reasoning,
        has_multiple_locations = EXCLUDED.has_multiple_locations,  -- snake_case!
        all_locations = EXCLUDED.all_locations,                    -- snake_case!
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."insert_location_cache"("p_domain" "text", "p_city" "text", "p_state" "text", "p_confidence" double precision, "p_method" "text", "p_reasoning" "text", "p_has_multiple" boolean, "p_all_locations" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pm_update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."pm_update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_buyer_personas_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_buyer_personas_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_core_truth_insights_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_core_truth_insights_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_v4_content_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_v4_content_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_value_propositions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_value_propositions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_intelligence_cache"("p_cache_key" "text", "p_data" "jsonb", "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_brand_id" "uuid" DEFAULT NULL::"uuid", "p_data_type" "text" DEFAULT NULL::"text", "p_source_api" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_id UUID;
  calculated_expires_at TIMESTAMPTZ;
BEGIN
  -- Default expiration: 24 hours from now
  calculated_expires_at := COALESCE(p_expires_at, NOW() + INTERVAL '24 hours');

  -- Upsert: insert or update if cache_key already exists
  INSERT INTO intelligence_cache (
    cache_key,
    data,
    expires_at,
    brand_id,
    data_type,
    source_api,
    created_at,
    updated_at
  )
  VALUES (
    p_cache_key,
    p_data,
    calculated_expires_at,
    p_brand_id,
    p_data_type,
    p_source_api,
    NOW(),
    NOW()
  )
  ON CONFLICT (cache_key)
  DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    brand_id = EXCLUDED.brand_id,
    data_type = EXCLUDED.data_type,
    source_api = EXCLUDED.source_api,
    updated_at = NOW()
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."upsert_intelligence_cache"("p_cache_key" "text", "p_data" "jsonb", "p_expires_at" timestamp with time zone, "p_brand_id" "uuid", "p_data_type" "text", "p_source_api" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brand_eq_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "emotional_quotient" integer NOT NULL,
    "rational_quotient" integer NOT NULL,
    "overall_eq" integer NOT NULL,
    "confidence_score" integer NOT NULL,
    "calculation_method" "text" NOT NULL,
    "specialty" "text",
    "industry" "text",
    "is_passion_product" boolean DEFAULT false,
    "specialty_contribution" "jsonb",
    "pattern_contribution" "jsonb",
    "content_contribution" "jsonb",
    "detected_signals" "jsonb",
    "recommendations" "jsonb",
    "calculation_id" "text" NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "brand_eq_scores_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100))),
    CONSTRAINT "brand_eq_scores_emotional_quotient_check" CHECK ((("emotional_quotient" >= 0) AND ("emotional_quotient" <= 100))),
    CONSTRAINT "brand_eq_scores_overall_eq_check" CHECK ((("overall_eq" >= 0) AND ("overall_eq" <= 100))),
    CONSTRAINT "brand_eq_scores_rational_quotient_check" CHECK ((("rational_quotient" >= 0) AND ("rational_quotient" <= 100)))
);


ALTER TABLE "public"."brand_eq_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."brand_eq_scores" IS 'Stores calculated emotional quotient scores for each brand';



COMMENT ON COLUMN "public"."brand_eq_scores"."emotional_quotient" IS 'Emotional score 0-100 (higher = more emotional messaging)';



COMMENT ON COLUMN "public"."brand_eq_scores"."rational_quotient" IS 'Rational score 0-100 (higher = more logical/data-driven messaging)';



COMMENT ON COLUMN "public"."brand_eq_scores"."overall_eq" IS 'Overall EQ score (same as emotional_quotient for simplicity)';



COMMENT ON COLUMN "public"."brand_eq_scores"."calculation_method" IS 'How EQ was calculated: specialty_based, pattern_based, content_only, or hybrid';



CREATE TABLE IF NOT EXISTS "public"."brand_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "session_name" "text" NOT NULL,
    "url_slug" "text" NOT NULL,
    "mirror_state" "jsonb",
    "uvp_state" "jsonb",
    "last_saved_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "completion_percentage" integer DEFAULT 0
);


ALTER TABLE "public"."brand_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "website" "text",
    "industry" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "emotional_quotient" integer,
    "eq_calculated_at" timestamp with time zone,
    "website_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "location_data" "jsonb" DEFAULT '{}'::"jsonb",
    "services_products" "jsonb" DEFAULT '[]'::"jsonb",
    "customer_triggers" "jsonb" DEFAULT '[]'::"jsonb",
    "market_trends" "jsonb" DEFAULT '[]'::"jsonb",
    "competitor_data" "jsonb" DEFAULT '[]'::"jsonb",
    "brand_voice" "jsonb" DEFAULT '{}'::"jsonb",
    "onboarding_completed_at" timestamp with time zone,
    "is_public" boolean DEFAULT false,
    "last_refresh_at" timestamp with time zone,
    "last_manual_refresh_at" timestamp with time zone,
    "manual_refresh_count" integer DEFAULT 0,
    "cached_intelligence" "jsonb",
    CONSTRAINT "brands_emotional_quotient_check" CHECK ((("emotional_quotient" >= 0) AND ("emotional_quotient" <= 100)))
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


COMMENT ON TABLE "public"."brands" IS 'Brands table - Dashboard fix applied 2025-11-22';



COMMENT ON COLUMN "public"."brands"."user_id" IS 'User ID - nullable for anonymous onboarding users';



CREATE TABLE IF NOT EXISTS "public"."buyer_personas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text",
    "company_type" "text",
    "industry" "text",
    "pain_points" "jsonb" DEFAULT '[]'::"jsonb",
    "desired_outcomes" "jsonb" DEFAULT '[]'::"jsonb",
    "jobs_to_be_done" "jsonb",
    "urgency_signals" "jsonb" DEFAULT '[]'::"jsonb",
    "buying_behavior" "jsonb",
    "validated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."buyer_personas" OWNER TO "postgres";


COMMENT ON TABLE "public"."buyer_personas" IS 'Buyer personas extracted from website and onboarding inputs';



CREATE TABLE IF NOT EXISTS "public"."campaign_pieces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "phase_id" character varying(100) NOT NULL,
    "title" character varying(500) NOT NULL,
    "content" "text" NOT NULL,
    "emotional_trigger" character varying(50) NOT NULL,
    "scheduled_date" timestamp with time zone,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "channel" character varying(50),
    "piece_order" integer DEFAULT 0 NOT NULL,
    "template_id" character varying(100),
    "performance_prediction" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_pieces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "purpose" character varying(50) NOT NULL,
    "template_id" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "arc" "jsonb",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "target_audience" "text",
    "industry_customization" "jsonb",
    "performance_prediction" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_calendar_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "platform" character varying(50) NOT NULL,
    "content_type" character varying(50),
    "status" character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    "scheduled_for" timestamp with time zone,
    "published_at" timestamp with time zone,
    "ai_score" integer,
    "tags" "text"[],
    "media_urls" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "valid_platform" CHECK ((("platform")::"text" = ANY ((ARRAY['facebook'::character varying, 'instagram'::character varying, 'linkedin'::character varying, 'twitter'::character varying, 'tiktok'::character varying, 'blog'::character varying, 'email'::character varying])::"text"[]))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'scheduled'::character varying, 'published'::character varying, 'failed'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."content_calendar_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."core_truth_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "core_truth" "text" NOT NULL,
    "psychological_drivers" "jsonb" DEFAULT '[]'::"jsonb",
    "transformation_promise" "text",
    "emotional_payoff" "text",
    "synthesis_reasoning" "text",
    "composite_eq_score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."core_truth_insights" OWNER TO "postgres";


COMMENT ON TABLE "public"."core_truth_insights" IS 'Synthesized core truth insights combining value props and personas';



CREATE TABLE IF NOT EXISTS "public"."eq_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pattern_id" "text" NOT NULL,
    "pattern_type" "text" NOT NULL,
    "detected_keywords" "text"[] NOT NULL,
    "keyword_density" "jsonb" NOT NULL,
    "has_testimonials" boolean DEFAULT false,
    "has_forums" boolean DEFAULT false,
    "has_pricing_tables" boolean DEFAULT false,
    "has_comparison_charts" boolean DEFAULT false,
    "has_contact_only_pricing" boolean DEFAULT false,
    "calculated_eq" integer NOT NULL,
    "confidence_score" integer NOT NULL,
    "business_name" "text",
    "specialty" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "eq_patterns_calculated_eq_check" CHECK ((("calculated_eq" >= 0) AND ("calculated_eq" <= 100))),
    CONSTRAINT "eq_patterns_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100)))
);


ALTER TABLE "public"."eq_patterns" OWNER TO "postgres";


COMMENT ON TABLE "public"."eq_patterns" IS 'Pattern signatures used by the learning engine to identify similar businesses';



CREATE TABLE IF NOT EXISTS "public"."eq_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "content_id" "uuid",
    "content_type" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "content_eq" integer NOT NULL,
    "target_eq" integer,
    "eq_variance" integer,
    "platform_adjustment" integer DEFAULT 0,
    "seasonal_adjustment" integer DEFAULT 0,
    "campaign_type_adjustment" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "engagement_count" integer DEFAULT 0,
    "engagement_rate" numeric(5,2),
    "click_count" integer DEFAULT 0,
    "click_rate" numeric(5,2),
    "conversion_count" integer DEFAULT 0,
    "conversion_rate" numeric(5,2),
    "published_at" timestamp with time zone,
    "measured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "eq_performance_metrics_content_eq_check" CHECK ((("content_eq" >= 0) AND ("content_eq" <= 100)))
);


ALTER TABLE "public"."eq_performance_metrics" OWNER TO "postgres";


COMMENT ON TABLE "public"."eq_performance_metrics" IS 'Tracks content performance to validate EQ-matched messaging effectiveness';



CREATE TABLE IF NOT EXISTS "public"."eq_specialty_baselines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "specialty" "text" NOT NULL,
    "base_eq" integer NOT NULL,
    "is_passion_product" boolean DEFAULT false,
    "sample_size" integer DEFAULT 0 NOT NULL,
    "confidence_score" integer NOT NULL,
    "example_businesses" "text"[] DEFAULT '{}'::"text"[],
    "avg_emotional_density" numeric(5,2),
    "avg_rational_density" numeric(5,2),
    "common_signals" "text"[] DEFAULT '{}'::"text"[],
    "first_learned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "eq_specialty_baselines_base_eq_check" CHECK ((("base_eq" >= 0) AND ("base_eq" <= 100))),
    CONSTRAINT "eq_specialty_baselines_confidence_score_check" CHECK ((("confidence_score" >= 0) AND ("confidence_score" <= 100)))
);


ALTER TABLE "public"."eq_specialty_baselines" OWNER TO "postgres";


COMMENT ON TABLE "public"."eq_specialty_baselines" IS 'Auto-learned EQ baselines for different business specialties';



CREATE TABLE IF NOT EXISTS "public"."industry_profiles" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "naics_code" "text",
    "profile_data" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "business_count" integer DEFAULT 0,
    "template_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "requires_local_reviews" boolean DEFAULT false,
    "requires_weather" boolean DEFAULT false,
    "requires_linkedin" boolean DEFAULT false
);


ALTER TABLE "public"."industry_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intelligence_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "brand_id" "uuid",
    "data_type" "text",
    "source_api" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intelligence_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."intelligence_cache" IS 'Intelligence cache with helper functions - Updated 2024-11-24';



CREATE TABLE IF NOT EXISTS "public"."location_detection_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain" "text",
    "cache_key" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "confidence" numeric(3,2) DEFAULT 0.00,
    "method" "text",
    "reasoning" "text",
    "hasmultiplelocations" boolean DEFAULT false,
    "alllocations" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "ip_address" "text",
    "raw_data" "jsonb",
    "has_multiple_locations" boolean DEFAULT false,
    "all_locations" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "valid_confidence" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))
);


ALTER TABLE "public"."location_detection_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."location_detection_cache" IS 'Location detection cache - Force reload complete';



COMMENT ON COLUMN "public"."location_detection_cache"."domain" IS 'Domain being cached';



COMMENT ON COLUMN "public"."location_detection_cache"."cache_key" IS 'Alternative cache key';



COMMENT ON COLUMN "public"."location_detection_cache"."confidence" IS 'Confidence score 0.00-1.00';



CREATE TABLE IF NOT EXISTS "public"."location_detection_cache_backup_20251122" (
    "id" "uuid",
    "cache_key" "text",
    "business_name" "text",
    "website_url" "text",
    "has_physical_location" boolean,
    "confidence_score" integer,
    "location_data" "jsonb",
    "created_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "domain" "text"
);


ALTER TABLE "public"."location_detection_cache_backup_20251122" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marba_uvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "products_services" "jsonb",
    "target_customer" "jsonb" NOT NULL,
    "transformation_goal" "jsonb" NOT NULL,
    "unique_solution" "jsonb" NOT NULL,
    "key_benefit" "jsonb" NOT NULL,
    "value_proposition_statement" "text" NOT NULL,
    "why_statement" "text",
    "what_statement" "text",
    "how_statement" "text",
    "overall_confidence" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "is_public" boolean DEFAULT false
);


ALTER TABLE "public"."marba_uvps" OWNER TO "postgres";


COMMENT ON TABLE "public"."marba_uvps" IS 'MARBA UVPs - Dashboard fix applied 2025-11-22';



CREATE TABLE IF NOT EXISTS "public"."naics_codes" (
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "keywords" "text"[],
    "category" "text",
    "has_full_profile" boolean DEFAULT false,
    "popularity" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."naics_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pm_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "parent_category_id" "uuid",
    "display_order" integer DEFAULT 0,
    "icon" character varying(100),
    "color" character varying(50),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pm_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."pm_categories" IS 'Product categories with hierarchical support';



CREATE TABLE IF NOT EXISTS "public"."pm_extraction_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "extraction_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "products_found" integer DEFAULT 0,
    "products_created" integer DEFAULT 0,
    "products_updated" integer DEFAULT 0,
    "products_skipped" integer DEFAULT 0,
    "error_message" "text",
    "error_details" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "pm_extraction_logs_extraction_type_check" CHECK ((("extraction_type")::"text" = ANY ((ARRAY['uvp'::character varying, 'website'::character varying, 'reviews'::character varying, 'keywords'::character varying, 'full'::character varying, 'manual'::character varying])::"text"[]))),
    CONSTRAINT "pm_extraction_logs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."pm_extraction_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."pm_extraction_logs" IS 'Audit log of product extraction operations';



CREATE TABLE IF NOT EXISTS "public"."pm_product_metadata" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "key" character varying(255) NOT NULL,
    "value" "text",
    "value_type" character varying(50) DEFAULT 'string'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pm_product_metadata_value_type_check" CHECK ((("value_type")::"text" = ANY ((ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying, 'date'::character varying, 'array'::character varying])::"text"[])))
);


ALTER TABLE "public"."pm_product_metadata" OWNER TO "postgres";


COMMENT ON TABLE "public"."pm_product_metadata" IS 'Flexible key-value metadata for products';



CREATE TABLE IF NOT EXISTS "public"."pm_product_sources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "source_type" character varying(50) NOT NULL,
    "source_url" "text",
    "source_data" "jsonb",
    "confidence_score" numeric(3,2) DEFAULT 1.0,
    "extracted_at" timestamp with time zone DEFAULT "now"(),
    "is_primary" boolean DEFAULT false,
    CONSTRAINT "pm_product_sources_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "pm_product_sources_source_type_check" CHECK ((("source_type")::"text" = ANY ((ARRAY['uvp'::character varying, 'website'::character varying, 'reviews'::character varying, 'keywords'::character varying, 'manual'::character varying, 'api'::character varying])::"text"[])))
);


ALTER TABLE "public"."pm_product_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."pm_product_sources" IS 'Tracks where products were extracted from';



CREATE TABLE IF NOT EXISTS "public"."pm_products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" character varying(500) NOT NULL,
    "slug" character varying(500) NOT NULL,
    "description" "text",
    "short_description" character varying(500),
    "price" numeric(12,2),
    "price_display" character varying(100),
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "features" "text"[] DEFAULT '{}'::"text"[],
    "benefits" "text"[] DEFAULT '{}'::"text"[],
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "is_service" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "is_bestseller" boolean DEFAULT false,
    "is_seasonal" boolean DEFAULT false,
    "seasonal_start" "date",
    "seasonal_end" "date",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "external_id" character varying(255),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pm_products_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'seasonal'::character varying, 'discontinued'::character varying, 'draft'::character varying])::"text"[])))
);


ALTER TABLE "public"."pm_products" OWNER TO "postgres";


COMMENT ON TABLE "public"."pm_products" IS 'Main product/service catalog for brands';



CREATE TABLE IF NOT EXISTS "public"."publishing_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "account_ids" "text"[] NOT NULL,
    "media" "text"[],
    "hashtags" "text"[],
    "scheduled_time" timestamp with time zone NOT NULL,
    "published_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "platform_post_id" "text",
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "next_retry" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "publishing_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'publishing'::"text", 'published'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."publishing_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."publishing_queue" IS 'Queue for scheduled content to be published via SocialPilot';



COMMENT ON COLUMN "public"."publishing_queue"."status" IS 'pending | publishing | published | failed';



COMMENT ON COLUMN "public"."publishing_queue"."retry_count" IS 'Number of times publishing has been retried';



COMMENT ON COLUMN "public"."publishing_queue"."max_retries" IS 'Maximum number of retry attempts (default: 3)';



CREATE TABLE IF NOT EXISTS "public"."socialpilot_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" "text" DEFAULT 'Bearer'::"text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."socialpilot_connections" OWNER TO "postgres";


COMMENT ON TABLE "public"."socialpilot_connections" IS 'Stores OAuth tokens for SocialPilot API integration';



CREATE TABLE IF NOT EXISTS "public"."uvp_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid",
    "session_name" "text" NOT NULL,
    "website_url" "text" NOT NULL,
    "current_step" "text" NOT NULL,
    "products_data" "jsonb",
    "customer_data" "jsonb",
    "transformation_data" "jsonb",
    "solution_data" "jsonb",
    "benefit_data" "jsonb",
    "complete_uvp" "jsonb",
    "scraped_content" "jsonb",
    "industry_info" "jsonb",
    "business_info" "jsonb",
    "completed_steps" "text"[],
    "progress_percentage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "is_public" boolean DEFAULT false
);


ALTER TABLE "public"."uvp_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."uvp_sessions" IS 'UVP sessions - RLS fixed 2025-11-21';



CREATE TABLE IF NOT EXISTS "public"."v4_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid",
    "user_id" "uuid",
    "uvp_id" "uuid",
    "name" "text" NOT NULL,
    "template_type" "text" NOT NULL,
    "mix_rule" "text" NOT NULL,
    "week_count" integer NOT NULL,
    "posts_per_week" integer DEFAULT 5 NOT NULL,
    "summary" "text",
    "recommendations" "text"[] DEFAULT ARRAY[]::"text"[],
    "total_content_count" integer DEFAULT 0 NOT NULL,
    "average_score" integer,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "v4_campaigns_mix_rule_check" CHECK (("mix_rule" = ANY (ARRAY['70-20-10'::"text", '4-1-1'::"text", '5-3-2'::"text"]))),
    CONSTRAINT "v4_campaigns_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'paused'::"text", 'archived'::"text"]))),
    CONSTRAINT "v4_campaigns_template_type_check" CHECK (("template_type" = ANY (ARRAY['product_launch'::"text", 'evergreen'::"text", 'awareness_burst'::"text", 'authority_builder'::"text", 'engagement_drive'::"text"])))
);


ALTER TABLE "public"."v4_campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."v4_campaigns" IS 'Campaigns created using V4 Content Engine templates';



CREATE TABLE IF NOT EXISTS "public"."v4_generated_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid",
    "user_id" "uuid",
    "uvp_id" "uuid",
    "headline" "text" NOT NULL,
    "hook" "text" NOT NULL,
    "body" "text" NOT NULL,
    "cta" "text" NOT NULL,
    "hashtags" "text"[] DEFAULT ARRAY[]::"text"[],
    "score_total" integer NOT NULL,
    "score_breakdown" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "score_prediction" "text" NOT NULL,
    "score_reasoning" "text"[] DEFAULT ARRAY[]::"text"[],
    "score_strengths" "text"[] DEFAULT ARRAY[]::"text"[],
    "score_weaknesses" "text"[] DEFAULT ARRAY[]::"text"[],
    "psychology_framework" "text" NOT NULL,
    "psychology_primary_trigger" "text" NOT NULL,
    "psychology_secondary_trigger" "text",
    "psychology_intensity" numeric(3,2) NOT NULL,
    "mix_category" "text" NOT NULL,
    "funnel_stage" "text" NOT NULL,
    "pillar_id" "text",
    "pillar_name" "text",
    "platform" "text" NOT NULL,
    "character_count" integer NOT NULL,
    "campaign_id" "uuid",
    "campaign_template" "text",
    "campaign_week" integer,
    "model" "text" DEFAULT 'claude-sonnet-4-20250514'::"text" NOT NULL,
    "generation_mode" "text" NOT NULL,
    "content_hash" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "v4_generated_content_funnel_stage_check" CHECK (("funnel_stage" = ANY (ARRAY['TOFU'::"text", 'MOFU'::"text", 'BOFU'::"text"]))),
    CONSTRAINT "v4_generated_content_generation_mode_check" CHECK (("generation_mode" = ANY (ARRAY['easy'::"text", 'power'::"text", 'mixer'::"text"]))),
    CONSTRAINT "v4_generated_content_mix_category_check" CHECK (("mix_category" = ANY (ARRAY['value'::"text", 'curated'::"text", 'promo'::"text", 'personal'::"text", 'soft_sell'::"text", 'hard_sell'::"text"]))),
    CONSTRAINT "v4_generated_content_platform_check" CHECK (("platform" = ANY (ARRAY['linkedin'::"text", 'instagram'::"text", 'twitter'::"text", 'facebook'::"text", 'tiktok'::"text"]))),
    CONSTRAINT "v4_generated_content_psychology_intensity_check" CHECK ((("psychology_intensity" >= (0)::numeric) AND ("psychology_intensity" <= (1)::numeric))),
    CONSTRAINT "v4_generated_content_score_prediction_check" CHECK (("score_prediction" = ANY (ARRAY['meh'::"text", 'good'::"text", 'great'::"text", 'holy shit'::"text"]))),
    CONSTRAINT "v4_generated_content_score_total_check" CHECK ((("score_total" >= 0) AND ("score_total" <= 100))),
    CONSTRAINT "v4_generated_content_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."v4_generated_content" OWNER TO "postgres";


COMMENT ON TABLE "public"."v4_generated_content" IS 'Content generated by the V4 Content Engine with full scoring and psychology metadata';



CREATE TABLE IF NOT EXISTS "public"."value_propositions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "statement" "text" NOT NULL,
    "category" "text" NOT NULL,
    "market_position" "text",
    "differentiators" "jsonb" DEFAULT '[]'::"jsonb",
    "confidence" "jsonb",
    "eq_score" "jsonb",
    "sources" "jsonb" DEFAULT '[]'::"jsonb",
    "validated" boolean DEFAULT false,
    "user_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "value_propositions_category_check" CHECK (("category" = ANY (ARRAY['core'::"text", 'secondary'::"text", 'aspirational'::"text"])))
);


ALTER TABLE "public"."value_propositions" OWNER TO "postgres";


COMMENT ON TABLE "public"."value_propositions" IS 'Value propositions from onboarding flow - core, secondary, and aspirational';



ALTER TABLE ONLY "public"."brand_eq_scores"
    ADD CONSTRAINT "brand_eq_scores_brand_id_key" UNIQUE ("brand_id");



ALTER TABLE ONLY "public"."brand_eq_scores"
    ADD CONSTRAINT "brand_eq_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brand_sessions"
    ADD CONSTRAINT "brand_sessions_brand_id_url_slug_key" UNIQUE ("brand_id", "url_slug");



ALTER TABLE ONLY "public"."brand_sessions"
    ADD CONSTRAINT "brand_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_website_unique" UNIQUE ("website");



COMMENT ON CONSTRAINT "brands_website_unique" ON "public"."brands" IS 'Ensures only one brand can exist per website URL. Prevents the duplicate brand issue that caused sessions to be orphaned.';



ALTER TABLE ONLY "public"."buyer_personas"
    ADD CONSTRAINT "buyer_personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_pieces"
    ADD CONSTRAINT "campaign_pieces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_calendar_items"
    ADD CONSTRAINT "content_calendar_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."core_truth_insights"
    ADD CONSTRAINT "core_truth_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eq_patterns"
    ADD CONSTRAINT "eq_patterns_pattern_id_key" UNIQUE ("pattern_id");



ALTER TABLE ONLY "public"."eq_patterns"
    ADD CONSTRAINT "eq_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eq_performance_metrics"
    ADD CONSTRAINT "eq_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eq_specialty_baselines"
    ADD CONSTRAINT "eq_specialty_baselines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eq_specialty_baselines"
    ADD CONSTRAINT "eq_specialty_baselines_specialty_key" UNIQUE ("specialty");



ALTER TABLE ONLY "public"."industry_profiles"
    ADD CONSTRAINT "industry_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intelligence_cache"
    ADD CONSTRAINT "intelligence_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."intelligence_cache"
    ADD CONSTRAINT "intelligence_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."location_detection_cache"
    ADD CONSTRAINT "location_detection_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marba_uvps"
    ADD CONSTRAINT "marba_uvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."naics_codes"
    ADD CONSTRAINT "naics_codes_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."pm_categories"
    ADD CONSTRAINT "pm_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pm_categories"
    ADD CONSTRAINT "pm_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."pm_extraction_logs"
    ADD CONSTRAINT "pm_extraction_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pm_product_metadata"
    ADD CONSTRAINT "pm_product_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pm_product_metadata"
    ADD CONSTRAINT "pm_product_metadata_unique" UNIQUE ("product_id", "key");



ALTER TABLE ONLY "public"."pm_product_sources"
    ADD CONSTRAINT "pm_product_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pm_products"
    ADD CONSTRAINT "pm_products_brand_slug_unique" UNIQUE ("brand_id", "slug");



ALTER TABLE ONLY "public"."pm_products"
    ADD CONSTRAINT "pm_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishing_queue"
    ADD CONSTRAINT "publishing_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."socialpilot_connections"
    ADD CONSTRAINT "socialpilot_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."socialpilot_connections"
    ADD CONSTRAINT "socialpilot_connections_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."location_detection_cache"
    ADD CONSTRAINT "unique_cache_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."location_detection_cache"
    ADD CONSTRAINT "unique_domain_cache" UNIQUE ("domain");



ALTER TABLE ONLY "public"."uvp_sessions"
    ADD CONSTRAINT "uvp_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v4_campaigns"
    ADD CONSTRAINT "v4_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v4_generated_content"
    ADD CONSTRAINT "v4_generated_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."value_propositions"
    ADD CONSTRAINT "value_propositions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_brand_eq_scores_brand_id" ON "public"."brand_eq_scores" USING "btree" ("brand_id");



CREATE INDEX "idx_brand_eq_scores_calculated_at" ON "public"."brand_eq_scores" USING "btree" ("calculated_at" DESC);



CREATE INDEX "idx_brand_eq_scores_overall_eq" ON "public"."brand_eq_scores" USING "btree" ("overall_eq");



CREATE INDEX "idx_brand_eq_scores_specialty" ON "public"."brand_eq_scores" USING "btree" ("specialty");



CREATE INDEX "idx_brand_sessions_brand_id" ON "public"."brand_sessions" USING "btree" ("brand_id");



CREATE INDEX "idx_brand_sessions_last_saved" ON "public"."brand_sessions" USING "btree" ("last_saved_at" DESC);



CREATE INDEX "idx_brand_sessions_url_slug" ON "public"."brand_sessions" USING "btree" ("url_slug");



CREATE INDEX "idx_brands_customer_triggers" ON "public"."brands" USING "gin" ("customer_triggers");



CREATE INDEX "idx_brands_emotional_quotient" ON "public"."brands" USING "btree" ("emotional_quotient");



CREATE INDEX "idx_brands_last_manual_refresh_at" ON "public"."brands" USING "btree" ("last_manual_refresh_at");



CREATE INDEX "idx_brands_last_refresh_at" ON "public"."brands" USING "btree" ("last_refresh_at");



CREATE INDEX "idx_brands_services_products" ON "public"."brands" USING "gin" ("services_products");



CREATE INDEX "idx_brands_user" ON "public"."brands" USING "btree" ("user_id");



CREATE INDEX "idx_brands_user_id" ON "public"."brands" USING "btree" ("user_id");



CREATE INDEX "idx_brands_website_analysis" ON "public"."brands" USING "gin" ("website_analysis");



CREATE INDEX "idx_buyer_personas_brand_id" ON "public"."buyer_personas" USING "btree" ("brand_id");



CREATE INDEX "idx_buyer_personas_role" ON "public"."buyer_personas" USING "btree" ("role");



CREATE INDEX "idx_cache_created" ON "public"."location_detection_cache" USING "btree" ("created_at");



CREATE INDEX "idx_cache_domain" ON "public"."location_detection_cache" USING "btree" ("domain");



CREATE INDEX "idx_cache_expires" ON "public"."location_detection_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_cache_key" ON "public"."location_detection_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_calendar_brand_id" ON "public"."content_calendar_items" USING "btree" ("brand_id");



CREATE INDEX "idx_calendar_platform" ON "public"."content_calendar_items" USING "btree" ("platform");



CREATE INDEX "idx_calendar_scheduled_for" ON "public"."content_calendar_items" USING "btree" ("scheduled_for");



CREATE INDEX "idx_calendar_status" ON "public"."content_calendar_items" USING "btree" ("status");



CREATE INDEX "idx_campaign_pieces_campaign_id" ON "public"."campaign_pieces" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaigns_brand_id" ON "public"."campaigns" USING "btree" ("brand_id");



CREATE INDEX "idx_core_truth_insights_brand_id" ON "public"."core_truth_insights" USING "btree" ("brand_id");



CREATE INDEX "idx_core_truth_insights_eq_score" ON "public"."core_truth_insights" USING "btree" ("composite_eq_score");



CREATE INDEX "idx_eq_patterns_calculated_eq" ON "public"."eq_patterns" USING "btree" ("calculated_eq");



CREATE INDEX "idx_eq_patterns_created_at" ON "public"."eq_patterns" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_eq_patterns_pattern_type" ON "public"."eq_patterns" USING "btree" ("pattern_type");



CREATE INDEX "idx_eq_patterns_specialty" ON "public"."eq_patterns" USING "btree" ("specialty");



CREATE INDEX "idx_eq_performance_brand_id" ON "public"."eq_performance_metrics" USING "btree" ("brand_id");



CREATE INDEX "idx_eq_performance_content_eq" ON "public"."eq_performance_metrics" USING "btree" ("content_eq");



CREATE INDEX "idx_eq_performance_platform" ON "public"."eq_performance_metrics" USING "btree" ("platform");



CREATE INDEX "idx_eq_performance_published_at" ON "public"."eq_performance_metrics" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_eq_specialty_baselines_base_eq" ON "public"."eq_specialty_baselines" USING "btree" ("base_eq");



CREATE INDEX "idx_eq_specialty_baselines_sample_size" ON "public"."eq_specialty_baselines" USING "btree" ("sample_size" DESC);



CREATE INDEX "idx_eq_specialty_baselines_specialty" ON "public"."eq_specialty_baselines" USING "btree" ("specialty");



CREATE INDEX "idx_industry_profiles_active" ON "public"."industry_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_industry_profiles_naics" ON "public"."industry_profiles" USING "btree" ("naics_code");



CREATE INDEX "idx_industry_profiles_name" ON "public"."industry_profiles" USING "btree" ("name");



CREATE INDEX "idx_industry_profiles_requires_linkedin" ON "public"."industry_profiles" USING "btree" ("requires_linkedin") WHERE ("requires_linkedin" = true);



CREATE INDEX "idx_industry_profiles_requires_local_reviews" ON "public"."industry_profiles" USING "btree" ("requires_local_reviews") WHERE ("requires_local_reviews" = true);



CREATE INDEX "idx_industry_profiles_requires_weather" ON "public"."industry_profiles" USING "btree" ("requires_weather") WHERE ("requires_weather" = true);



CREATE INDEX "idx_industry_profiles_search" ON "public"."industry_profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_intelligence_cache_brand" ON "public"."intelligence_cache" USING "btree" ("brand_id");



CREATE INDEX "idx_intelligence_cache_expires" ON "public"."intelligence_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_intelligence_cache_key" ON "public"."intelligence_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_marba_uvps_brand_id" ON "public"."marba_uvps" USING "btree" ("brand_id");



CREATE INDEX "idx_marba_uvps_user_id" ON "public"."marba_uvps" USING "btree" ("user_id");



CREATE INDEX "idx_pm_categories_active" ON "public"."pm_categories" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_pm_categories_parent" ON "public"."pm_categories" USING "btree" ("parent_category_id");



CREATE INDEX "idx_pm_categories_slug" ON "public"."pm_categories" USING "btree" ("slug");



CREATE INDEX "idx_pm_extraction_logs_brand" ON "public"."pm_extraction_logs" USING "btree" ("brand_id");



CREATE INDEX "idx_pm_extraction_logs_started" ON "public"."pm_extraction_logs" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_pm_extraction_logs_status" ON "public"."pm_extraction_logs" USING "btree" ("status");



CREATE INDEX "idx_pm_extraction_logs_type" ON "public"."pm_extraction_logs" USING "btree" ("extraction_type");



CREATE INDEX "idx_pm_product_metadata_key" ON "public"."pm_product_metadata" USING "btree" ("key");



CREATE INDEX "idx_pm_product_metadata_product" ON "public"."pm_product_metadata" USING "btree" ("product_id");



CREATE INDEX "idx_pm_product_sources_primary" ON "public"."pm_product_sources" USING "btree" ("product_id") WHERE ("is_primary" = true);



CREATE INDEX "idx_pm_product_sources_product" ON "public"."pm_product_sources" USING "btree" ("product_id");



CREATE INDEX "idx_pm_product_sources_type" ON "public"."pm_product_sources" USING "btree" ("source_type");



CREATE INDEX "idx_pm_products_bestseller" ON "public"."pm_products" USING "btree" ("is_bestseller") WHERE ("is_bestseller" = true);



CREATE INDEX "idx_pm_products_brand" ON "public"."pm_products" USING "btree" ("brand_id");



CREATE INDEX "idx_pm_products_category" ON "public"."pm_products" USING "btree" ("category_id");



CREATE INDEX "idx_pm_products_external_id" ON "public"."pm_products" USING "btree" ("external_id") WHERE ("external_id" IS NOT NULL);



CREATE INDEX "idx_pm_products_featured" ON "public"."pm_products" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_pm_products_name_search" ON "public"."pm_products" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("name")::"text"));



CREATE INDEX "idx_pm_products_seasonal" ON "public"."pm_products" USING "btree" ("is_seasonal") WHERE ("is_seasonal" = true);



CREATE INDEX "idx_pm_products_status" ON "public"."pm_products" USING "btree" ("status");



CREATE INDEX "idx_pm_products_tags" ON "public"."pm_products" USING "gin" ("tags");



CREATE INDEX "idx_publishing_queue_content_id" ON "public"."publishing_queue" USING "btree" ("content_id");



CREATE INDEX "idx_publishing_queue_processing" ON "public"."publishing_queue" USING "btree" ("status", "scheduled_time") WHERE ("status" = ANY (ARRAY['pending'::"text", 'publishing'::"text"]));



CREATE INDEX "idx_publishing_queue_scheduled_time" ON "public"."publishing_queue" USING "btree" ("scheduled_time") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_publishing_queue_status" ON "public"."publishing_queue" USING "btree" ("status");



CREATE INDEX "idx_publishing_queue_user_id" ON "public"."publishing_queue" USING "btree" ("user_id");



CREATE INDEX "idx_socialpilot_connections_expires_at" ON "public"."socialpilot_connections" USING "btree" ("expires_at");



CREATE INDEX "idx_socialpilot_connections_user_id" ON "public"."socialpilot_connections" USING "btree" ("user_id");



CREATE INDEX "idx_uvp_sessions_brand_id" ON "public"."uvp_sessions" USING "btree" ("brand_id");



CREATE INDEX "idx_uvp_sessions_user_id" ON "public"."uvp_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_v4_campaigns_brand_id" ON "public"."v4_campaigns" USING "btree" ("brand_id");



CREATE INDEX "idx_v4_campaigns_status" ON "public"."v4_campaigns" USING "btree" ("status");



CREATE INDEX "idx_v4_campaigns_user_id" ON "public"."v4_campaigns" USING "btree" ("user_id");



CREATE INDEX "idx_v4_content_brand_id" ON "public"."v4_generated_content" USING "btree" ("brand_id");



CREATE INDEX "idx_v4_content_campaign" ON "public"."v4_generated_content" USING "btree" ("campaign_id") WHERE ("campaign_id" IS NOT NULL);



CREATE INDEX "idx_v4_content_created_at" ON "public"."v4_generated_content" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_v4_content_funnel_stage" ON "public"."v4_generated_content" USING "btree" ("funnel_stage");



CREATE INDEX "idx_v4_content_hash" ON "public"."v4_generated_content" USING "btree" ("content_hash") WHERE ("content_hash" IS NOT NULL);



CREATE INDEX "idx_v4_content_mix_category" ON "public"."v4_generated_content" USING "btree" ("mix_category");



CREATE INDEX "idx_v4_content_platform" ON "public"."v4_generated_content" USING "btree" ("platform");



CREATE INDEX "idx_v4_content_score" ON "public"."v4_generated_content" USING "btree" ("score_total" DESC);



CREATE INDEX "idx_v4_content_status" ON "public"."v4_generated_content" USING "btree" ("status");



CREATE INDEX "idx_v4_content_user_id" ON "public"."v4_generated_content" USING "btree" ("user_id");



CREATE INDEX "idx_v4_content_uvp_id" ON "public"."v4_generated_content" USING "btree" ("uvp_id");



CREATE INDEX "idx_value_propositions_brand_id" ON "public"."value_propositions" USING "btree" ("brand_id");



CREATE INDEX "idx_value_propositions_category" ON "public"."value_propositions" USING "btree" ("category");



CREATE OR REPLACE TRIGGER "buyer_personas_updated_at" BEFORE UPDATE ON "public"."buyer_personas" FOR EACH ROW EXECUTE FUNCTION "public"."update_buyer_personas_updated_at"();



CREATE OR REPLACE TRIGGER "core_truth_insights_updated_at" BEFORE UPDATE ON "public"."core_truth_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_core_truth_insights_updated_at"();



CREATE OR REPLACE TRIGGER "pm_categories_updated_at" BEFORE UPDATE ON "public"."pm_categories" FOR EACH ROW EXECUTE FUNCTION "public"."pm_update_updated_at"();



CREATE OR REPLACE TRIGGER "pm_products_updated_at" BEFORE UPDATE ON "public"."pm_products" FOR EACH ROW EXECUTE FUNCTION "public"."pm_update_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_v4_campaigns_updated_at" BEFORE UPDATE ON "public"."v4_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_v4_content_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_v4_content_updated_at" BEFORE UPDATE ON "public"."v4_generated_content" FOR EACH ROW EXECUTE FUNCTION "public"."update_v4_content_updated_at"();



CREATE OR REPLACE TRIGGER "update_brand_eq_scores_updated_at" BEFORE UPDATE ON "public"."brand_eq_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_calendar_items_updated_at" BEFORE UPDATE ON "public"."content_calendar_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_marba_uvps_updated_at" BEFORE UPDATE ON "public"."marba_uvps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_publishing_queue_updated_at" BEFORE UPDATE ON "public"."publishing_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_socialpilot_connections_updated_at" BEFORE UPDATE ON "public"."socialpilot_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "value_propositions_updated_at" BEFORE UPDATE ON "public"."value_propositions" FOR EACH ROW EXECUTE FUNCTION "public"."update_value_propositions_updated_at"();



ALTER TABLE ONLY "public"."brand_eq_scores"
    ADD CONSTRAINT "brand_eq_scores_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."buyer_personas"
    ADD CONSTRAINT "buyer_personas_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_pieces"
    ADD CONSTRAINT "campaign_pieces_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_calendar_items"
    ADD CONSTRAINT "content_calendar_items_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."core_truth_insights"
    ADD CONSTRAINT "core_truth_insights_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eq_performance_metrics"
    ADD CONSTRAINT "eq_performance_metrics_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intelligence_cache"
    ADD CONSTRAINT "intelligence_cache_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marba_uvps"
    ADD CONSTRAINT "marba_uvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pm_categories"
    ADD CONSTRAINT "pm_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."pm_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pm_extraction_logs"
    ADD CONSTRAINT "pm_extraction_logs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pm_product_metadata"
    ADD CONSTRAINT "pm_product_metadata_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."pm_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pm_product_sources"
    ADD CONSTRAINT "pm_product_sources_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."pm_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pm_products"
    ADD CONSTRAINT "pm_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pm_products"
    ADD CONSTRAINT "pm_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."pm_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."publishing_queue"
    ADD CONSTRAINT "publishing_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."socialpilot_connections"
    ADD CONSTRAINT "socialpilot_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uvp_sessions"
    ADD CONSTRAINT "uvp_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."v4_campaigns"
    ADD CONSTRAINT "v4_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."v4_campaigns"
    ADD CONSTRAINT "v4_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v4_campaigns"
    ADD CONSTRAINT "v4_campaigns_uvp_id_fkey" FOREIGN KEY ("uvp_id") REFERENCES "public"."marba_uvps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v4_generated_content"
    ADD CONSTRAINT "v4_generated_content_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."v4_generated_content"
    ADD CONSTRAINT "v4_generated_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v4_generated_content"
    ADD CONSTRAINT "v4_generated_content_uvp_id_fkey" FOREIGN KEY ("uvp_id") REFERENCES "public"."marba_uvps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."value_propositions"
    ADD CONSTRAINT "value_propositions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all to insert naics_codes" ON "public"."naics_codes" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow all to update naics_codes keywords" ON "public"."naics_codes" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated to update naics_codes" ON "public"."naics_codes" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow creating industry profiles" ON "public"."industry_profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow reading industry profiles" ON "public"."industry_profiles" FOR SELECT USING (true);



CREATE POLICY "Allow reading naics codes" ON "public"."naics_codes" FOR SELECT USING (true);



CREATE POLICY "Allow updating industry profiles" ON "public"."industry_profiles" FOR UPDATE USING (true);



CREATE POLICY "Anonymous access for demo" ON "public"."v4_generated_content" USING (("user_id" IS NULL)) WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anonymous access for demo campaigns" ON "public"."v4_campaigns" USING (("user_id" IS NULL)) WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Authenticated can delete intelligence_cache" ON "public"."intelligence_cache" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated can update intelligence_cache" ON "public"."intelligence_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated can write industry_profiles" ON "public"."industry_profiles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated can write intelligence_cache" ON "public"."intelligence_cache" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can write naics_codes" ON "public"."naics_codes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can insert profiles" ON "public"."industry_profiles" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Authenticated users can update profiles" ON "public"."industry_profiles" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Public can delete brand_sessions" ON "public"."brand_sessions" FOR DELETE USING (true);



CREATE POLICY "Public can delete uvp_sessions" ON "public"."uvp_sessions" FOR DELETE USING (true);



CREATE POLICY "Public can insert brand_sessions" ON "public"."brand_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can insert uvp_sessions" ON "public"."uvp_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can read brand_sessions" ON "public"."brand_sessions" FOR SELECT USING (true);



CREATE POLICY "Public can read uvp_sessions" ON "public"."uvp_sessions" FOR SELECT USING (true);



CREATE POLICY "Public can update brand_sessions" ON "public"."brand_sessions" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public can update uvp_sessions" ON "public"."uvp_sessions" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public delete intelligence" ON "public"."intelligence_cache" FOR DELETE USING (true);



CREATE POLICY "Public insert location cache" ON "public"."location_detection_cache" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read industry profiles" ON "public"."industry_profiles" FOR SELECT USING (true);



CREATE POLICY "Public read industry_profiles" ON "public"."industry_profiles" FOR SELECT USING (true);



CREATE POLICY "Public read intelligence" ON "public"."intelligence_cache" FOR SELECT USING (true);



CREATE POLICY "Public read intelligence_cache" ON "public"."intelligence_cache" FOR SELECT USING (true);



CREATE POLICY "Public read location cache" ON "public"."location_detection_cache" FOR SELECT USING (true);



CREATE POLICY "Public read naics codes" ON "public"."naics_codes" FOR SELECT USING (true);



CREATE POLICY "Public read naics_codes" ON "public"."naics_codes" FOR SELECT USING (true);



CREATE POLICY "Public update intelligence" ON "public"."intelligence_cache" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public update location cache" ON "public"."location_detection_cache" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public write intelligence" ON "public"."intelligence_cache" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service manage naics codes" ON "public"."naics_codes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manage industry profiles" ON "public"."industry_profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "TEMP_DEV_delete_eq_scores" ON "public"."brand_eq_scores" FOR DELETE USING (true);



CREATE POLICY "TEMP_DEV_insert_eq_scores" ON "public"."brand_eq_scores" FOR INSERT WITH CHECK (true);



CREATE POLICY "TEMP_DEV_select_eq_scores" ON "public"."brand_eq_scores" FOR SELECT USING (true);



CREATE POLICY "TEMP_DEV_update_eq_scores" ON "public"."brand_eq_scores" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete own campaigns" ON "public"."v4_campaigns" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can delete own content" ON "public"."v4_generated_content" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert campaigns" ON "public"."v4_campaigns" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert content" ON "public"."v4_generated_content" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can read own campaigns" ON "public"."v4_campaigns" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can read own content" ON "public"."v4_generated_content" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update own campaigns" ON "public"."v4_campaigns" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update own content" ON "public"."v4_generated_content" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "allow_all_operations" ON "public"."location_detection_cache" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_update_buyer_personas" ON "public"."buyer_personas" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_content_calendar_items" ON "public"."content_calendar_items" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_core_truth_insights" ON "public"."core_truth_insights" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_eq_patterns" ON "public"."eq_patterns" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_eq_performance_metrics" ON "public"."eq_performance_metrics" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_eq_specialty_baselines" ON "public"."eq_specialty_baselines" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_publishing_queue" ON "public"."publishing_queue" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_socialpilot_connections" ON "public"."socialpilot_connections" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_value_propositions" ON "public"."value_propositions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_buyer_personas" ON "public"."buyer_personas" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_content_calendar_items" ON "public"."content_calendar_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_core_truth_insights" ON "public"."core_truth_insights" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_eq_patterns" ON "public"."eq_patterns" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_eq_performance_metrics" ON "public"."eq_performance_metrics" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_eq_specialty_baselines" ON "public"."eq_specialty_baselines" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_publishing_queue" ON "public"."publishing_queue" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_socialpilot_connections" ON "public"."socialpilot_connections" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_value_propositions" ON "public"."value_propositions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "basic_read_buyer_personas" ON "public"."buyer_personas" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_content_calendar_items" ON "public"."content_calendar_items" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_core_truth_insights" ON "public"."core_truth_insights" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_eq_patterns" ON "public"."eq_patterns" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_eq_performance_metrics" ON "public"."eq_performance_metrics" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_eq_specialty_baselines" ON "public"."eq_specialty_baselines" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_publishing_queue" ON "public"."publishing_queue" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_socialpilot_connections" ON "public"."socialpilot_connections" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "basic_read_value_propositions" ON "public"."value_propositions" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."brand_eq_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brand_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_delete_policy" ON "public"."brands" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "brands_insert_policy" ON "public"."brands" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "brands_select_policy" ON "public"."brands" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "brands_update_policy" ON "public"."brands" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."buyer_personas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cache_insert_all_v9" ON "public"."location_detection_cache" FOR INSERT WITH CHECK (true);



CREATE POLICY "cache_select_all_v9" ON "public"."location_detection_cache" FOR SELECT USING (true);



ALTER TABLE "public"."campaign_pieces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_pieces_all_access" ON "public"."campaign_pieces" USING (true) WITH CHECK (true);



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_all_access" ON "public"."campaigns" USING (true) WITH CHECK (true);



ALTER TABLE "public"."content_calendar_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."core_truth_insights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dev_allow_all_access" ON "public"."brand_eq_scores" USING (true) WITH CHECK (true);



CREATE POLICY "dev_allow_all_access" ON "public"."industry_profiles" USING (true) WITH CHECK (true);



ALTER TABLE "public"."eq_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eq_performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."eq_specialty_baselines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."industry_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intelligence_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marba_uvps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marba_uvps_delete_policy" ON "public"."marba_uvps" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "marba_uvps_insert_policy" ON "public"."marba_uvps" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "marba_uvps_select_policy" ON "public"."marba_uvps" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "marba_uvps_update_policy" ON "public"."marba_uvps" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."naics_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pm_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pm_categories_insert_authenticated" ON "public"."pm_categories" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_categories_select_all" ON "public"."pm_categories" FOR SELECT USING (true);



CREATE POLICY "pm_categories_update_authenticated" ON "public"."pm_categories" FOR UPDATE USING (true);



ALTER TABLE "public"."pm_extraction_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pm_extraction_logs_insert" ON "public"."pm_extraction_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_extraction_logs_select" ON "public"."pm_extraction_logs" FOR SELECT USING (true);



CREATE POLICY "pm_extraction_logs_update" ON "public"."pm_extraction_logs" FOR UPDATE USING (true);



ALTER TABLE "public"."pm_product_metadata" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pm_product_metadata_delete" ON "public"."pm_product_metadata" FOR DELETE USING (true);



CREATE POLICY "pm_product_metadata_insert" ON "public"."pm_product_metadata" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_product_metadata_select" ON "public"."pm_product_metadata" FOR SELECT USING (true);



CREATE POLICY "pm_product_metadata_update" ON "public"."pm_product_metadata" FOR UPDATE USING (true);



ALTER TABLE "public"."pm_product_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pm_product_sources_delete" ON "public"."pm_product_sources" FOR DELETE USING (true);



CREATE POLICY "pm_product_sources_insert" ON "public"."pm_product_sources" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_product_sources_select" ON "public"."pm_product_sources" FOR SELECT USING (true);



CREATE POLICY "pm_product_sources_update" ON "public"."pm_product_sources" FOR UPDATE USING (true);



ALTER TABLE "public"."pm_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pm_products_delete" ON "public"."pm_products" FOR DELETE USING (true);



CREATE POLICY "pm_products_insert" ON "public"."pm_products" FOR INSERT WITH CHECK (true);



CREATE POLICY "pm_products_select_all" ON "public"."pm_products" FOR SELECT USING (true);



CREATE POLICY "pm_products_update" ON "public"."pm_products" FOR UPDATE USING (true);



CREATE POLICY "public_read_cache" ON "public"."location_detection_cache" FOR SELECT USING (true);



ALTER TABLE "public"."publishing_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."socialpilot_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."uvp_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v4_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v4_generated_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."value_propositions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_marba_uvp"("p_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_marba_uvp"("p_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_marba_uvp"("p_brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_intelligence_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_intelligence_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_intelligence_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_brand_for_dashboard"("p_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_brand_for_dashboard"("p_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_brand_for_dashboard"("p_brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_intelligence_cache"("p_cache_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_intelligence_cache"("p_cache_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_intelligence_cache"("p_cache_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_location_cache"("p_domain" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_location_cache"("p_domain" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_location_cache"("p_domain" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_marba_uvps_for_dashboard"("p_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_marba_uvps_for_dashboard"("p_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marba_uvps_for_dashboard"("p_brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_location_cache"("p_domain" "text", "p_city" "text", "p_state" "text", "p_confidence" double precision, "p_method" "text", "p_reasoning" "text", "p_has_multiple" boolean, "p_all_locations" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_location_cache"("p_domain" "text", "p_city" "text", "p_state" "text", "p_confidence" double precision, "p_method" "text", "p_reasoning" "text", "p_has_multiple" boolean, "p_all_locations" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_location_cache"("p_domain" "text", "p_city" "text", "p_state" "text", "p_confidence" double precision, "p_method" "text", "p_reasoning" "text", "p_has_multiple" boolean, "p_all_locations" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."pm_update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."pm_update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pm_update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_buyer_personas_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_buyer_personas_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_buyer_personas_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_core_truth_insights_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_core_truth_insights_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_core_truth_insights_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_v4_content_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_v4_content_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_v4_content_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_value_propositions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_value_propositions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_value_propositions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_intelligence_cache"("p_cache_key" "text", "p_data" "jsonb", "p_expires_at" timestamp with time zone, "p_brand_id" "uuid", "p_data_type" "text", "p_source_api" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_intelligence_cache"("p_cache_key" "text", "p_data" "jsonb", "p_expires_at" timestamp with time zone, "p_brand_id" "uuid", "p_data_type" "text", "p_source_api" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_intelligence_cache"("p_cache_key" "text", "p_data" "jsonb", "p_expires_at" timestamp with time zone, "p_brand_id" "uuid", "p_data_type" "text", "p_source_api" "text") TO "service_role";



GRANT ALL ON TABLE "public"."brand_eq_scores" TO "anon";
GRANT ALL ON TABLE "public"."brand_eq_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_eq_scores" TO "service_role";
GRANT ALL ON TABLE "public"."brand_eq_scores" TO PUBLIC;



GRANT ALL ON TABLE "public"."brand_sessions" TO "anon";
GRANT ALL ON TABLE "public"."brand_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_sessions" TO "service_role";
GRANT ALL ON TABLE "public"."brand_sessions" TO PUBLIC;



GRANT ALL ON TABLE "public"."brands" TO "anon" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."brands" TO "authenticated" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."brands" TO "service_role";
GRANT ALL ON TABLE "public"."brands" TO PUBLIC;



GRANT ALL ON TABLE "public"."buyer_personas" TO "anon";
GRANT ALL ON TABLE "public"."buyer_personas" TO "authenticated";
GRANT ALL ON TABLE "public"."buyer_personas" TO "service_role";
GRANT ALL ON TABLE "public"."buyer_personas" TO PUBLIC;



GRANT ALL ON TABLE "public"."campaign_pieces" TO "anon";
GRANT ALL ON TABLE "public"."campaign_pieces" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_pieces" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."content_calendar_items" TO "anon";
GRANT ALL ON TABLE "public"."content_calendar_items" TO "authenticated";
GRANT ALL ON TABLE "public"."content_calendar_items" TO "service_role";
GRANT ALL ON TABLE "public"."content_calendar_items" TO PUBLIC;



GRANT ALL ON TABLE "public"."core_truth_insights" TO "anon";
GRANT ALL ON TABLE "public"."core_truth_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."core_truth_insights" TO "service_role";
GRANT ALL ON TABLE "public"."core_truth_insights" TO PUBLIC;



GRANT ALL ON TABLE "public"."eq_patterns" TO "anon";
GRANT ALL ON TABLE "public"."eq_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."eq_patterns" TO "service_role";
GRANT ALL ON TABLE "public"."eq_patterns" TO PUBLIC;



GRANT ALL ON TABLE "public"."eq_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."eq_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."eq_performance_metrics" TO "service_role";
GRANT ALL ON TABLE "public"."eq_performance_metrics" TO PUBLIC;



GRANT ALL ON TABLE "public"."eq_specialty_baselines" TO "anon";
GRANT ALL ON TABLE "public"."eq_specialty_baselines" TO "authenticated";
GRANT ALL ON TABLE "public"."eq_specialty_baselines" TO "service_role";
GRANT ALL ON TABLE "public"."eq_specialty_baselines" TO PUBLIC;



GRANT ALL ON TABLE "public"."industry_profiles" TO "anon";
GRANT ALL ON TABLE "public"."industry_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."industry_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."industry_profiles" TO PUBLIC;



GRANT ALL ON TABLE "public"."intelligence_cache" TO "anon" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."intelligence_cache" TO "authenticated" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."intelligence_cache" TO "service_role";
GRANT ALL ON TABLE "public"."intelligence_cache" TO PUBLIC;



GRANT ALL ON TABLE "public"."location_detection_cache" TO "anon";
GRANT ALL ON TABLE "public"."location_detection_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."location_detection_cache" TO "service_role";
GRANT ALL ON TABLE "public"."location_detection_cache" TO PUBLIC;



GRANT ALL ON TABLE "public"."location_detection_cache_backup_20251122" TO "anon";
GRANT ALL ON TABLE "public"."location_detection_cache_backup_20251122" TO "authenticated";
GRANT ALL ON TABLE "public"."location_detection_cache_backup_20251122" TO "service_role";
GRANT ALL ON TABLE "public"."location_detection_cache_backup_20251122" TO PUBLIC;



GRANT ALL ON TABLE "public"."marba_uvps" TO "anon";
GRANT ALL ON TABLE "public"."marba_uvps" TO "authenticated";
GRANT ALL ON TABLE "public"."marba_uvps" TO "service_role";
GRANT ALL ON TABLE "public"."marba_uvps" TO PUBLIC;



GRANT ALL ON TABLE "public"."naics_codes" TO "anon";
GRANT ALL ON TABLE "public"."naics_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."naics_codes" TO "service_role";
GRANT ALL ON TABLE "public"."naics_codes" TO PUBLIC;



GRANT ALL ON TABLE "public"."pm_categories" TO "anon";
GRANT ALL ON TABLE "public"."pm_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_categories" TO "service_role";



GRANT ALL ON TABLE "public"."pm_extraction_logs" TO "anon";
GRANT ALL ON TABLE "public"."pm_extraction_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_extraction_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pm_product_metadata" TO "anon";
GRANT ALL ON TABLE "public"."pm_product_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_product_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."pm_product_sources" TO "anon";
GRANT ALL ON TABLE "public"."pm_product_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_product_sources" TO "service_role";



GRANT ALL ON TABLE "public"."pm_products" TO "anon";
GRANT ALL ON TABLE "public"."pm_products" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_products" TO "service_role";



GRANT ALL ON TABLE "public"."publishing_queue" TO "anon";
GRANT ALL ON TABLE "public"."publishing_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."publishing_queue" TO "service_role";
GRANT ALL ON TABLE "public"."publishing_queue" TO PUBLIC;



GRANT ALL ON TABLE "public"."socialpilot_connections" TO "anon";
GRANT ALL ON TABLE "public"."socialpilot_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."socialpilot_connections" TO "service_role";
GRANT ALL ON TABLE "public"."socialpilot_connections" TO PUBLIC;



GRANT ALL ON TABLE "public"."uvp_sessions" TO "anon" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."uvp_sessions" TO "authenticated" WITH GRANT OPTION;
GRANT ALL ON TABLE "public"."uvp_sessions" TO "service_role";
GRANT ALL ON TABLE "public"."uvp_sessions" TO PUBLIC;



GRANT ALL ON TABLE "public"."v4_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."v4_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."v4_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."v4_generated_content" TO "anon";
GRANT ALL ON TABLE "public"."v4_generated_content" TO "authenticated";
GRANT ALL ON TABLE "public"."v4_generated_content" TO "service_role";



GRANT ALL ON TABLE "public"."value_propositions" TO "anon";
GRANT ALL ON TABLE "public"."value_propositions" TO "authenticated";
GRANT ALL ON TABLE "public"."value_propositions" TO "service_role";
GRANT ALL ON TABLE "public"."value_propositions" TO PUBLIC;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







