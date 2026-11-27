-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TOURIST', 'PARTNER', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('HOTEL', 'RESTAURANT', 'ATTRACTION');

-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'FROZEN');

-- CreateEnum
CREATE TYPE "PlaceSource" AS ENUM ('PARTNER', 'BOOKING', 'MANUAL');

-- CreateEnum
CREATE TYPE "PartnerPlan" AS ENUM ('BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('HOTEL', 'RESTAURANT', 'GUEST_HOUSE', 'ATTRACTION');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('HOTEL', 'TABLE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'ARRIVED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('WALK', 'METRO', 'BUS', 'AIRPORT_EXPRESS', 'TAXI', 'TRAIN');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('PER_PERSON', 'PER_VEHICLE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TOURIST',
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" SERIAL NOT NULL,
    "business_name" TEXT NOT NULL,
    "voen" TEXT NOT NULL,
    "owner_user_id" INTEGER NOT NULL,
    "plan" "PartnerPlan" NOT NULL DEFAULT 'BASIC',
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_applications" (
    "id" SERIAL NOT NULL,
    "business_type" "BusinessType" NOT NULL,
    "business_name" TEXT NOT NULL,
    "voen" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PlaceType" NOT NULL,
    "status" "PlaceStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "PlaceSource" NOT NULL DEFAULT 'MANUAL',
    "name" JSONB NOT NULL,
    "description" JSONB,
    "address" TEXT,
    "area_id" INTEGER,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "price_from" DECIMAL(10,2),
    "price_level" INTEGER,
    "stars" INTEGER,
    "categories" TEXT[],
    "recommended_minutes" INTEGER,
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "booking_url" TEXT,
    "official_ticket_url" TEXT,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_order" INTEGER,
    "partner_id" INTEGER,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_photos" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "place_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_amenities" (
    "place_id" INTEGER NOT NULL,
    "amenity_id" INTEGER NOT NULL,

    CONSTRAINT "place_amenities_pkey" PRIMARY KEY ("place_id","amenity_id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "opens_at" TEXT,
    "closes_at" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "size_m2" INTEGER,
    "bed_type" TEXT,
    "max_guests" INTEGER NOT NULL,
    "price_per_night" DECIMAL(10,2) NOT NULL,
    "free_cancellation" BOOLEAN NOT NULL DEFAULT false,
    "breakfast_included" BOOLEAN NOT NULL DEFAULT false,
    "photos" TEXT[],
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "name" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "price" DECIMAL(10,2) NOT NULL,
    "weight_grams" INTEGER,
    "photo" TEXT,
    "tags" TEXT[],
    "is_set" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_prices" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "label" JSONB NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ticket_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "discount_percent" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "user_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE,
    "time" TEXT,
    "guests" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "special_requests" TEXT[],
    "total_estimate" DECIMAL(10,2),
    "decline_reason" TEXT,
    "responded_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "room_id" INTEGER,
    "menu_item_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "note" TEXT,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_messages" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "request_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "category_ratings" JSONB,
    "text" TEXT,
    "photos" TEXT[],
    "travel_type" TEXT,
    "partner_reply" TEXT,
    "partner_replied_at" TIMESTAMP(3),
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","place_id")
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "region_id" INTEGER,
    "from_key" TEXT NOT NULL,
    "to_key" TEXT NOT NULL,
    "from_label" JSONB NOT NULL,
    "to_label" JSONB NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "price_min" DECIMAL(10,2) NOT NULL,
    "price_max" DECIMAL(10,2),
    "price_unit" "PriceUnit" NOT NULL DEFAULT 'PER_PERSON',
    "duration_min" INTEGER NOT NULL,
    "transfers" INTEGER NOT NULL DEFAULT 0,
    "walk_meters" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_steps" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "instruction" JSONB NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "photo" TEXT,

    CONSTRAINT "route_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "days" INTEGER NOT NULL,
    "cover_photo" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_stops" (
    "id" SERIAL NOT NULL,
    "itinerary_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "time" TEXT,
    "sort_order" INTEGER NOT NULL,
    "note" JSONB,

    CONSTRAINT "itinerary_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "interest" TEXT NOT NULL DEFAULT 'REGIONS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "areas_region_id_slug_key" ON "areas"("region_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "partners_voen_key" ON "partners"("voen");

-- CreateIndex
CREATE UNIQUE INDEX "partners_owner_user_id_key" ON "partners"("owner_user_id");

-- CreateIndex
CREATE INDEX "partner_applications_status_idx" ON "partner_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE INDEX "places_type_status_idx" ON "places"("type", "status");

-- CreateIndex
CREATE INDEX "places_area_id_idx" ON "places"("area_id");

-- CreateIndex
CREATE INDEX "places_partner_id_idx" ON "places"("partner_id");

-- CreateIndex
CREATE INDEX "place_photos_place_id_idx" ON "place_photos"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_code_key" ON "amenities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "opening_hours_place_id_day_of_week_key" ON "opening_hours"("place_id", "day_of_week");

-- CreateIndex
CREATE INDEX "rooms_place_id_idx" ON "rooms"("place_id");

-- CreateIndex
CREATE INDEX "menu_categories_place_id_idx" ON "menu_categories"("place_id");

-- CreateIndex
CREATE INDEX "menu_items_category_id_idx" ON "menu_items"("category_id");

-- CreateIndex
CREATE INDEX "ticket_prices_place_id_idx" ON "ticket_prices"("place_id");

-- CreateIndex
CREATE INDEX "offers_place_id_idx" ON "offers"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_requests_code_key" ON "booking_requests"("code");

-- CreateIndex
CREATE INDEX "booking_requests_user_id_idx" ON "booking_requests"("user_id");

-- CreateIndex
CREATE INDEX "booking_requests_place_id_status_idx" ON "booking_requests"("place_id", "status");

-- CreateIndex
CREATE INDEX "request_items_request_id_idx" ON "request_items"("request_id");

-- CreateIndex
CREATE INDEX "request_messages_request_id_idx" ON "request_messages"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_request_id_key" ON "reviews"("request_id");

-- CreateIndex
CREATE INDEX "reviews_place_id_status_idx" ON "reviews"("place_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_slug_key" ON "transport_routes"("slug");

-- CreateIndex
CREATE INDEX "transport_routes_from_key_to_key_idx" ON "transport_routes"("from_key", "to_key");

-- CreateIndex
CREATE INDEX "route_steps_route_id_idx" ON "route_steps"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_slug_key" ON "itineraries"("slug");

-- CreateIndex
CREATE INDEX "itinerary_stops_itinerary_id_idx" ON "itinerary_stops"("itinerary_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_photos" ADD CONSTRAINT "place_photos_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_amenities" ADD CONSTRAINT "place_amenities_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_amenities" ADD CONSTRAINT "place_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_prices" ADD CONSTRAINT "ticket_prices_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_messages" ADD CONSTRAINT "request_messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_messages" ADD CONSTRAINT "request_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_steps" ADD CONSTRAINT "route_steps_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
