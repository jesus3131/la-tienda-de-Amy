--
-- PostgreSQL database dump
--

\restrict rPyX4xdSkVzgziV28iPhcFUpcvH56Q866hRlt526kNToAaGa2EAxPIYCusevjbL

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    before_state jsonb,
    after_state jsonb,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO erp;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.branches OWNER TO erp;

--
-- Name: businesses; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    tax_id character varying(50),
    address text,
    phone character varying(50),
    email character varying(255),
    country character varying(100) DEFAULT 'Colombia'::character varying,
    currency character varying(10) DEFAULT 'COP'::character varying,
    timezone character varying(50) DEFAULT 'America/Bogota'::character varying,
    logo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.businesses OWNER TO erp;

--
-- Name: cash_movements; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.cash_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cash_session_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(14,4) NOT NULL,
    reason text,
    reference_type character varying(50),
    reference_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cash_movements_type_check CHECK (((type)::text = ANY ((ARRAY['in'::character varying, 'out'::character varying, 'sale'::character varying, 'refund'::character varying])::text[])))
);


ALTER TABLE public.cash_movements OWNER TO erp;

--
-- Name: cash_registers; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.cash_registers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cash_registers OWNER TO erp;

--
-- Name: cash_sessions; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.cash_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cash_register_id uuid NOT NULL,
    user_id uuid NOT NULL,
    opening_balance numeric(14,4) DEFAULT 0 NOT NULL,
    closing_balance numeric(14,4),
    expected_balance numeric(14,4),
    difference numeric(14,4),
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    opened_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    CONSTRAINT cash_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.cash_sessions OWNER TO erp;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text DEFAULT ''::text,
    parent_id uuid,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO erp;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(255) NOT NULL,
    document_id character varying(50),
    phone character varying(50),
    email character varying(255),
    address text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO erp;

--
-- Name: goods_receipt_items; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.goods_receipt_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goods_receipt_id uuid NOT NULL,
    purchase_order_item_id uuid NOT NULL,
    product_id uuid NOT NULL,
    batch_id uuid,
    quantity numeric(14,4) NOT NULL,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goods_receipt_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.goods_receipt_items OWNER TO erp;

--
-- Name: goods_receipts; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.goods_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    received_by uuid,
    received_at timestamp with time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.goods_receipts OWNER TO erp;

--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.idempotency_keys (
    key character varying(100) NOT NULL,
    response jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.idempotency_keys OWNER TO erp;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    quantity numeric(14,4) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory OWNER TO erp;

--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    branch_id uuid,
    warehouse_id uuid,
    product_id uuid NOT NULL,
    batch_id uuid,
    movement_type character varying(30) NOT NULL,
    quantity numeric(14,4) NOT NULL,
    stock_before numeric(14,4) DEFAULT 0 NOT NULL,
    stock_after numeric(14,4) DEFAULT 0 NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    reason text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventory_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['entry'::character varying, 'exit'::character varying, 'adjustment'::character varying, 'sale'::character varying, 'return'::character varying, 'transfer'::character varying, 'expiry'::character varying, 'merma'::character varying])::text[])))
);


ALTER TABLE public.inventory_movements OWNER TO erp;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    user_id uuid,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    data jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO erp;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    aggregate_type character varying(100) NOT NULL,
    aggregate_id uuid,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    retry_count integer DEFAULT 0,
    next_retry_at timestamp with time zone DEFAULT now(),
    failed boolean DEFAULT false
);


ALTER TABLE public.outbox_events OWNER TO erp;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    method character varying(30) NOT NULL,
    amount numeric(14,4) NOT NULL,
    reference character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['cash'::character varying, 'card'::character varying, 'transfer'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO erp;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO erp;

--
-- Name: product_batches; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.product_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    batch_number character varying(100),
    quantity numeric(14,4) DEFAULT 0 NOT NULL,
    expiry_date date,
    cost_price numeric(14,4),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.product_batches OWNER TO erp;

--
-- Name: product_suppliers; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.product_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    cost_price numeric(14,4),
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.product_suppliers OWNER TO erp;

--
-- Name: products; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    category_id uuid,
    primary_supplier_id uuid,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    name character varying(255) NOT NULL,
    description text DEFAULT ''::text,
    image_url text,
    unit_of_measure character varying(50) DEFAULT 'unit'::character varying,
    cost_price numeric(14,4) DEFAULT 0 NOT NULL,
    sale_price numeric(14,4) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    margin_percent numeric(5,2),
    min_stock numeric(14,4) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO erp;

--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(14,4) NOT NULL,
    unit_cost numeric(14,4) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    received_quantity numeric(14,4) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_order_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.purchase_order_items OWNER TO erp;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    branch_id uuid,
    supplier_id uuid NOT NULL,
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    subtotal numeric(14,4) DEFAULT 0 NOT NULL,
    tax_total numeric(14,4) DEFAULT 0 NOT NULL,
    total numeric(14,4) DEFAULT 0 NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'partial'::character varying, 'received'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.purchase_orders OWNER TO erp;

--
-- Name: refund_items; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.refund_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    refund_id uuid NOT NULL,
    sale_item_id uuid NOT NULL,
    quantity numeric(14,4) NOT NULL,
    amount numeric(14,4) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refund_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.refund_items OWNER TO erp;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    user_id uuid,
    reason text,
    total numeric(14,4) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.refunds OWNER TO erp;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO erp;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO erp;

--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    product_id uuid NOT NULL,
    batch_id uuid,
    quantity numeric(14,4) NOT NULL,
    unit_price numeric(14,4) DEFAULT 0 NOT NULL,
    discount numeric(14,4) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0,
    total numeric(14,4) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sale_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.sale_items OWNER TO erp;

--
-- Name: sales; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    branch_id uuid,
    warehouse_id uuid,
    customer_id uuid,
    cash_session_id uuid,
    user_id uuid,
    sale_number character varying(50),
    status character varying(30) DEFAULT 'completed'::character varying NOT NULL,
    subtotal numeric(14,4) DEFAULT 0 NOT NULL,
    tax_total numeric(14,4) DEFAULT 0 NOT NULL,
    discount_total numeric(14,4) DEFAULT 0 NOT NULL,
    total numeric(14,4) DEFAULT 0 NOT NULL,
    idempotency_key character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sales_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.sales OWNER TO erp;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(255) NOT NULL,
    company character varying(255),
    tax_id character varying(50),
    phone character varying(50),
    email character varying(255),
    address text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.suppliers OWNER TO erp;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    key character varying(100) NOT NULL,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO erp;

--
-- Name: user_branch_access; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.user_branch_access (
    user_id uuid NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.user_branch_access OWNER TO erp;

--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint character varying(255) NOT NULL,
    device_name character varying(255),
    trusted boolean DEFAULT false,
    last_seen timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_devices OWNER TO erp;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO erp;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255),
    device_name character varying(255),
    ip_address character varying(50),
    user_agent text,
    token_hash text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone
);


ALTER TABLE public.user_sessions OWNER TO erp;

--
-- Name: users; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO erp;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: erp
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO erp;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.audit_logs (id, business_id, user_id, action, entity_type, entity_id, before_state, after_state, ip_address, created_at) FROM stdin;
42ee6b81-32a3-4937-b772-d270fa316536	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	sale.create	sale	a1b5ca20-53e5-4385-a630-186c590be05d	\N	{"total": "2500.0000"}	::1	2026-11-02 02:20:07.319241+00
dbee9d48-8851-4530-aa40-186d83a64f9c	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	sale.create	sale	a1b5ca20-53e5-4385-a630-186c590be05d	\N	{"total": "2500.0000"}	::1	2026-11-02 02:20:07.347316+00
3c84ab39-03e4-490c-bcb4-a609f6f27762	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	38bf8e6a-da70-4b76-8b04-3134b4eed559	\N	{"id": "38bf8e6a-da70-4b76-8b04-3134b4eed559", "sku": "RBAC-TEST", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:45:51.443Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:45:51.443Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:45:51.488743+00
d59b17ee-a495-4ed0-9a09-31004dcea882	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	d9888c03-3358-4cfd-99c6-ad45f16fe64f	\N	{"id": "d9888c03-3358-4cfd-99c6-ad45f16fe64f", "sku": "RBAC-TEST", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:46:54.244Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:46:54.244Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:46:54.308534+00
db659545-6c68-4802-a322-771c008de228	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	8fd4897a-0640-431c-b59d-7659e237513b	\N	{"id": "8fd4897a-0640-431c-b59d-7659e237513b", "sku": "RBAC-TEST-1793587643411", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:47:23.418Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:47:23.418Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:47:23.422267+00
e08c3898-5348-4338-a835-060b501415aa	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	19d04b92-8dd8-40bd-97c5-bbabbc5c3d20	\N	{"id": "19d04b92-8dd8-40bd-97c5-bbabbc5c3d20", "sku": "RBAC-TEST-1793587648009", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:47:28.020Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:47:28.020Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:47:28.024582+00
6c6d3626-a1ef-4c1e-9bf8-4c7c7779f62f	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	495aa9b3-2c3c-432b-8951-b98a4678d9df	\N	{"id": "495aa9b3-2c3c-432b-8951-b98a4678d9df", "sku": "RBAC-TEST-1793587686286", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:48:06.301Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:48:06.301Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:48:06.304761+00
24e4981b-440a-4d0a-8287-c403a5e3ca44	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	c4038129-f26d-4288-a2cf-158134e3af5c	\N	{"id": "c4038129-f26d-4288-a2cf-158134e3af5c", "sku": "RBAC-TEST-1793587990543", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T02:53:10.559Z", "sale_price": "10.0000", "updated_at": "2026-11-02T02:53:10.559Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 02:53:10.566213+00
bffd3c53-2c58-4f54-b2e6-c3db936321f1	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	e376f6be-abaa-4f0b-ac0c-aceb35088c57	\N	{"id": "e376f6be-abaa-4f0b-ac0c-aceb35088c57", "sku": "RBAC-TEST-1793588588298", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T03:03:08.319Z", "sale_price": "10.0000", "updated_at": "2026-11-02T03:03:08.319Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 03:03:08.332299+00
faccc4f5-9a30-4d91-a59a-0483356f40f2	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	38075d58-9085-4de7-8013-bf59345ba17d	\N	{"id": "38075d58-9085-4de7-8013-bf59345ba17d", "sku": "RBAC-TEST-1793588592222", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T03:03:12.228Z", "sale_price": "10.0000", "updated_at": "2026-11-02T03:03:12.228Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 03:03:12.232657+00
2b51eb6d-9af9-4f3c-8d11-bcf57be73a2a	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	3f832d8f-fcdb-41c1-8546-8c7e656b2c9d	\N	{"id": "3f832d8f-fcdb-41c1-8546-8c7e656b2c9d", "sku": "RBAC-TEST-1793588598936", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T03:03:18.944Z", "sale_price": "10.0000", "updated_at": "2026-11-02T03:03:18.944Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 03:03:18.94628+00
fa8dec08-fc87-4990-ac97-378132e3de89	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	product.create	product	833281ff-4946-4208-a5c9-487c00c9d824	\N	{"id": "833281ff-4946-4208-a5c9-487c00c9d824", "sku": "RBAC-TEST-1793588827104", "name": "RBAC Product", "barcode": null, "tax_rate": "0.00", "image_url": null, "is_active": true, "min_stock": "0.0000", "cost_price": "0.0000", "created_at": "2026-11-02T03:07:07.119Z", "sale_price": "10.0000", "updated_at": "2026-11-02T03:07:07.119Z", "business_id": "11111111-1111-1111-1111-111111111111", "category_id": null, "description": "", "margin_percent": null, "unit_of_measure": "unit", "primary_supplier_id": null}	::1	2026-11-02 03:07:07.125995+00
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.branches (id, business_id, name, address, phone, is_active, created_at, updated_at) FROM stdin;
22222222-2222-2222-2222-222222222222	11111111-1111-1111-1111-111111111111	Sucursal Principal	\N	\N	t	2026-11-02 01:56:54.570394+00	2026-11-02 01:56:54.570394+00
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.businesses (id, name, tax_id, address, phone, email, country, currency, timezone, logo_url, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	Mi Tienda	\N	\N	\N	\N	Colombia	COP	America/Bogota	\N	2026-11-02 01:56:54.566611+00	2026-11-02 01:56:54.566611+00
\.


--
-- Data for Name: cash_movements; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.cash_movements (id, cash_session_id, type, amount, reason, reference_type, reference_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: cash_registers; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.cash_registers (id, branch_id, name, is_active, created_at) FROM stdin;
55555555-5555-5555-5555-555555555555	22222222-2222-2222-2222-222222222222	Caja Principal	t	2026-11-02 01:56:54.598138+00
\.


--
-- Data for Name: cash_sessions; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.cash_sessions (id, cash_register_id, user_id, opening_balance, closing_balance, expected_balance, difference, status, opened_at, closed_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.categories (id, business_id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at) FROM stdin;
bba33c4b-320e-4e9a-a2c4-7efe2e979e0a	11111111-1111-1111-1111-111111111111	Abarrotes	abarrotes		\N	t	1	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
557bb1b4-f33c-4825-9a5a-559114321d5d	11111111-1111-1111-1111-111111111111	Lácteos	lacteos		\N	t	2	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
927273b7-4b8d-4b99-8a08-9850c845f640	11111111-1111-1111-1111-111111111111	Bebidas	bebidas		\N	t	3	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
1e72c3b9-b93a-4907-afe3-4877f75a77fe	11111111-1111-1111-1111-111111111111	Aseo	aseo		\N	t	4	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
cd4fe55e-5581-4f64-969c-89186a8064d3	11111111-1111-1111-1111-111111111111	Carnes	carnes		\N	t	5	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
cf917982-3204-48b7-a521-6b2caa6f3050	11111111-1111-1111-1111-111111111111	Frutas y Verduras	frutas-verduras		\N	t	6	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
2ebbd0d0-82ca-44d1-9263-a57ed016afa0	11111111-1111-1111-1111-111111111111	Granos	granos		\N	t	7	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
2236a110-464d-4087-97e1-70f3f92b97d8	11111111-1111-1111-1111-111111111111	Congelados	congelados		\N	t	8	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
149ebb0d-c9de-488c-a65c-1c1d56a15743	11111111-1111-1111-1111-111111111111	Otros	otros		\N	t	9	2026-11-02 01:56:54.604269+00	2026-11-02 01:56:54.604269+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.customers (id, business_id, name, document_id, phone, email, address, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: goods_receipt_items; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.goods_receipt_items (id, goods_receipt_id, purchase_order_item_id, product_id, batch_id, quantity, expiry_date, created_at) FROM stdin;
\.


--
-- Data for Name: goods_receipts; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.goods_receipts (id, purchase_order_id, warehouse_id, status, received_by, received_at, notes) FROM stdin;
\.


--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.idempotency_keys (key, response, created_at) FROM stdin;
idem-test-1	{"total": 20, "saleId": "dc79a482-6a62-457a-a6c0-8ef1a73a147d", "status": "completed"}	2026-11-02 02:19:50.239355+00
idem-manual-1	{"total": 2500, "saleId": "a1b5ca20-53e5-4385-a630-186c590be05d", "status": "completed"}	2026-11-02 02:20:07.265654+00
idem-test-1793586062924	{"total": 20, "saleId": "699ecd72-c1ee-4a3d-85e1-d040ad18cefb", "status": "completed"}	2026-11-02 02:21:02.923714+00
idem-test-1793586076586	{"total": 20, "saleId": "04765ca3-aad8-4a47-a03b-7accfe8c4a76", "status": "completed"}	2026-11-02 02:21:16.587649+00
idem-test-1793586538891	{"total": 20, "saleId": "ccfc9fb5-3f01-415b-859a-51ee536ba179", "status": "completed"}	2026-11-02 02:28:58.890882+00
idem-test-1793586694484	{"total": 20, "saleId": "268be55d-108f-4824-9126-f350a3ed64ea", "status": "completed"}	2026-11-02 02:31:34.485749+00
idem-test-1793587286584	{"total": 20, "saleId": "90464ccf-c3b8-4b91-9952-3d85016bbe5b", "status": "completed"}	2026-11-02 02:41:26.582965+00
idem-test-1793587338166	{"total": 20, "saleId": "8950bb7a-9a5a-4b33-b198-00c0f6fed2bf", "status": "completed"}	2026-11-02 02:42:18.171026+00
idem-test-1793587620134	{"total": 20, "saleId": "4448ac34-0054-4ab5-8097-60128f9d3474", "status": "completed"}	2026-11-02 02:47:00.133656+00
idem-test-1793587627455	{"total": 20, "saleId": "4c0edf87-4717-4a32-bb71-8a5f1ae4d6a1", "status": "completed"}	2026-11-02 02:47:07.457657+00
idem-test-1793587647792	{"total": 20, "saleId": "4a15c5a3-f1c5-4aa2-9e95-2a16b7de5ec6", "status": "completed"}	2026-11-02 02:47:27.790566+00
idem-test-1793587686135	{"total": 20, "saleId": "b2a7d9d5-890c-49d7-9cd6-22202db85200", "status": "completed"}	2026-11-02 02:48:06.137432+00
idem-test-1793587990357	{"total": 20, "saleId": "ae33a7ca-c3d2-493d-b914-bf3813d2269d", "status": "completed"}	2026-11-02 02:53:10.358535+00
idem-test-1793588598810	{"total": 20, "saleId": "2c53b92b-56c0-4947-bb9f-0609fff10c63", "status": "completed"}	2026-11-02 03:03:18.811808+00
idem-test-1793588826662	{"total": 20, "saleId": "a8eca397-8904-46cc-aa47-f3194efca0cc", "status": "completed"}	2026-11-02 03:07:06.664489+00
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.inventory (id, product_id, warehouse_id, quantity, updated_at) FROM stdin;
091db651-a9a6-4228-96c9-a68a9c56aa94	d017b391-966e-4948-a7d6-2ddb68b0406c	33333333-3333-3333-3333-333333333333	12.0000	2026-11-02 02:20:07.265654+00
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.inventory_movements (id, business_id, branch_id, warehouse_id, product_id, batch_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, reason, user_id, created_at) FROM stdin;
99778030-e99b-483e-95ec-6620af1831f2	11111111-1111-1111-1111-111111111111	\N	33333333-3333-3333-3333-333333333333	d017b391-966e-4948-a7d6-2ddb68b0406c	\N	entry	10.0000	0.0000	10.0000	\N	\N	seed	44444444-4444-4444-4444-444444444444	2026-11-02 02:08:42.202508+00
9b9002c0-608a-4c48-ad53-d637a72f655d	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	33333333-3333-3333-3333-333333333333	d017b391-966e-4948-a7d6-2ddb68b0406c	\N	sale	-2.0000	10.0000	8.0000	sale	aecf111e-ced7-4f34-bcda-3ca5b0e6c5f8	\N	44444444-4444-4444-4444-444444444444	2026-11-02 02:08:42.273843+00
88b5e046-a504-48af-802d-cd2deae1c937	11111111-1111-1111-1111-111111111111	\N	33333333-3333-3333-3333-333333333333	d017b391-966e-4948-a7d6-2ddb68b0406c	\N	entry	5.0000	8.0000	13.0000	\N	\N	test	44444444-4444-4444-4444-444444444444	2026-11-02 02:20:07.239658+00
d165944b-14c5-4764-bb74-6fc5bd75b191	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	33333333-3333-3333-3333-333333333333	d017b391-966e-4948-a7d6-2ddb68b0406c	\N	sale	-1.0000	13.0000	12.0000	sale	a1b5ca20-53e5-4385-a630-186c590be05d	\N	44444444-4444-4444-4444-444444444444	2026-11-02 02:20:07.265654+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.notifications (id, business_id, user_id, type, title, message, data, read, created_at) FROM stdin;
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.outbox_events (id, aggregate_type, aggregate_id, event_type, payload, published, created_at, retry_count, next_retry_at, failed) FROM stdin;
be6e8143-7bf0-4d1b-bf68-dc1d00b233e0	sale	aecf111e-ced7-4f34-bcda-3ca5b0e6c5f8	sale.completed	{"total": 5000, "saleId": "aecf111e-ced7-4f34-bcda-3ca5b0e6c5f8"}	t	2026-11-02 02:08:42.273843+00	0	2026-11-02 02:45:26.277349+00	f
d3a7a064-feae-4438-b2e5-2a5740b74351	sale	c46fad0d-f16b-46e5-a43f-c5f73ddf9c7b	sale.completed	{"total": 60, "saleId": "c46fad0d-f16b-46e5-a43f-c5f73ddf9c7b"}	t	2026-11-02 02:19:50.175171+00	0	2026-11-02 02:45:26.277349+00	f
1b2f7cfd-e095-455b-aa29-1486dcccc7d1	sale	dc79a482-6a62-457a-a6c0-8ef1a73a147d	sale.completed	{"total": 20, "saleId": "dc79a482-6a62-457a-a6c0-8ef1a73a147d"}	t	2026-11-02 02:19:50.239355+00	0	2026-11-02 02:45:26.277349+00	f
8250983c-21af-4f8e-916c-79e67fdbc2cb	sale	daba4596-af81-4b68-8662-3172c7526f5e	sale.completed	{"total": 60, "saleId": "daba4596-af81-4b68-8662-3172c7526f5e"}	t	2026-11-02 02:20:00.525424+00	0	2026-11-02 02:45:26.277349+00	f
ea37ffd9-900d-4650-b29c-212f4f5c83a2	sale	a1b5ca20-53e5-4385-a630-186c590be05d	sale.completed	{"total": 2500, "saleId": "a1b5ca20-53e5-4385-a630-186c590be05d"}	t	2026-11-02 02:20:07.265654+00	0	2026-11-02 02:45:26.277349+00	f
a2fdcfa6-1f27-437b-8288-358c8a2be584	sale	d40c5a93-1440-416d-ae4e-141ddb1e2c42	sale.completed	{"total": 60, "saleId": "d40c5a93-1440-416d-ae4e-141ddb1e2c42"}	t	2026-11-02 02:20:15.639314+00	0	2026-11-02 02:45:26.277349+00	f
36ea0375-df5b-4960-9807-3af3cfaed9b1	sale	f5096ca6-16c4-498c-8d78-b28ab0503a12	sale.completed	{"total": 60, "saleId": "f5096ca6-16c4-498c-8d78-b28ab0503a12"}	t	2026-11-02 02:21:02.538573+00	0	2026-11-02 02:45:26.277349+00	f
d53875d3-f1f6-4ba1-9a33-b70dfb699738	sale	699ecd72-c1ee-4a3d-85e1-d040ad18cefb	sale.completed	{"total": 20, "saleId": "699ecd72-c1ee-4a3d-85e1-d040ad18cefb"}	t	2026-11-02 02:21:02.923714+00	0	2026-11-02 02:45:26.277349+00	f
bbc8e5df-892b-4110-a3b8-6185da24a8c4	sale	b65a688e-8576-4ba8-a114-2f4517eccd58	sale.completed	{"total": 60, "saleId": "b65a688e-8576-4ba8-a114-2f4517eccd58"}	t	2026-11-02 02:21:16.504821+00	0	2026-11-02 02:45:26.277349+00	f
2e53fa0d-f67b-4667-b0e3-5c48dc59600e	sale	04765ca3-aad8-4a47-a03b-7accfe8c4a76	sale.completed	{"total": 20, "saleId": "04765ca3-aad8-4a47-a03b-7accfe8c4a76"}	t	2026-11-02 02:21:16.587649+00	0	2026-11-02 02:45:26.277349+00	f
2f64e45d-4397-45c2-abb9-d32765f2e1c0	sale	be209ebc-600f-4a4d-95fd-4b2a58de1087	sale.completed	{"total": 60, "saleId": "be209ebc-600f-4a4d-95fd-4b2a58de1087"}	t	2026-11-02 02:28:58.808931+00	0	2026-11-02 02:45:26.277349+00	f
bb5b95f4-5e1c-4bd1-85e3-12adeb31732c	sale	ccfc9fb5-3f01-415b-859a-51ee536ba179	sale.completed	{"total": 20, "saleId": "ccfc9fb5-3f01-415b-859a-51ee536ba179"}	t	2026-11-02 02:28:58.890882+00	0	2026-11-02 02:45:26.277349+00	f
f0f987bf-d2fe-49f2-ad8a-70e40c93b5b6	sale	90221326-85dd-444f-98cf-5df2bc538716	sale.completed	{"total": 60, "saleId": "90221326-85dd-444f-98cf-5df2bc538716"}	t	2026-11-02 02:31:34.422002+00	0	2026-11-02 02:45:26.277349+00	f
8b957e7e-5263-4d99-bfd0-1775ee436308	sale	268be55d-108f-4824-9126-f350a3ed64ea	sale.completed	{"total": 20, "saleId": "268be55d-108f-4824-9126-f350a3ed64ea"}	t	2026-11-02 02:31:34.485749+00	0	2026-11-02 02:45:26.277349+00	f
902d91f7-b386-47a5-9e16-657126cc6c1f	sale	2a001793-0586-4fd3-aa52-c01c314b8acc	sale.completed	{"total": 60, "saleId": "2a001793-0586-4fd3-aa52-c01c314b8acc"}	t	2026-11-02 02:41:26.494415+00	0	2026-11-02 02:45:26.277349+00	f
e53eb932-b2f4-44ef-8541-d538662b6f07	sale	90464ccf-c3b8-4b91-9952-3d85016bbe5b	sale.completed	{"total": 20, "saleId": "90464ccf-c3b8-4b91-9952-3d85016bbe5b"}	t	2026-11-02 02:41:26.582965+00	0	2026-11-02 02:45:26.277349+00	f
1bea6ab5-843d-4e16-84ab-d6469d7e7790	sale	624a50e0-8591-4f21-a1b0-0331f50d0101	sale.completed	{"total": 60, "saleId": "624a50e0-8591-4f21-a1b0-0331f50d0101"}	t	2026-11-02 02:42:18.073487+00	0	2026-11-02 02:45:26.277349+00	f
17cf1c16-4a21-4d19-948b-a76bb93c1b71	sale	8950bb7a-9a5a-4b33-b198-00c0f6fed2bf	sale.completed	{"total": 20, "saleId": "8950bb7a-9a5a-4b33-b198-00c0f6fed2bf"}	t	2026-11-02 02:42:18.171026+00	0	2026-11-02 02:45:26.277349+00	f
27cdda1f-81a6-4c27-b25e-030b3c37bd85	sale	ae62d36a-e8a7-4ca4-9658-6d532028c283	sale.completed	{"total": 60, "saleId": "ae62d36a-e8a7-4ca4-9658-6d532028c283"}	t	2026-11-02 02:46:59.998331+00	0	2026-11-02 02:46:59.998331+00	f
5abb7884-bf1f-4ad6-8a65-e553800a3298	sale	4448ac34-0054-4ab5-8097-60128f9d3474	sale.completed	{"total": 20, "saleId": "4448ac34-0054-4ab5-8097-60128f9d3474"}	t	2026-11-02 02:47:00.133656+00	0	2026-11-02 02:47:00.133656+00	f
23b73eaa-ec11-41fb-9c7a-8d681fa33365	sale	94146943-a995-4685-8c0e-4ef352c271ae	sale.completed	{"total": 60, "saleId": "94146943-a995-4685-8c0e-4ef352c271ae"}	t	2026-11-02 02:47:07.305537+00	0	2026-11-02 02:47:07.305537+00	f
c755845c-8297-41d7-8d0f-0c60ed779930	sale	4c0edf87-4717-4a32-bb71-8a5f1ae4d6a1	sale.completed	{"total": 20, "saleId": "4c0edf87-4717-4a32-bb71-8a5f1ae4d6a1"}	t	2026-11-02 02:47:07.457657+00	0	2026-11-02 02:47:07.457657+00	f
5e9bf6c2-9eb8-41e6-a4f9-0668b7b48930	sale	77db1fed-a391-4614-be76-98e8cfa61d32	sale.completed	{"total": 60, "saleId": "77db1fed-a391-4614-be76-98e8cfa61d32"}	t	2026-11-02 02:47:27.715451+00	0	2026-11-02 02:47:27.715451+00	f
c15e0832-7742-41a3-bdbc-177e2c36725c	sale	4a15c5a3-f1c5-4aa2-9e95-2a16b7de5ec6	sale.completed	{"total": 20, "saleId": "4a15c5a3-f1c5-4aa2-9e95-2a16b7de5ec6"}	t	2026-11-02 02:47:27.790566+00	0	2026-11-02 02:47:27.790566+00	f
d410f008-8441-4a2f-8e74-c093296f4aff	sale	d4df71fd-cbd5-4325-97eb-684118c939e0	sale.completed	{"total": 60, "saleId": "d4df71fd-cbd5-4325-97eb-684118c939e0"}	t	2026-11-02 02:48:06.075948+00	0	2026-11-02 02:48:06.075948+00	f
06ad30c9-e20b-4ba1-9082-06321ec1d449	sale	b2a7d9d5-890c-49d7-9cd6-22202db85200	sale.completed	{"total": 20, "saleId": "b2a7d9d5-890c-49d7-9cd6-22202db85200"}	t	2026-11-02 02:48:06.137432+00	0	2026-11-02 02:48:06.137432+00	f
b3e87775-c78e-41f6-9c31-0c024a5409fb	sale	d778872a-9491-48df-bc96-3b09e0b87720	sale.completed	{"total": 60, "saleId": "d778872a-9491-48df-bc96-3b09e0b87720"}	t	2026-11-02 02:53:10.288747+00	0	2026-11-02 02:53:10.288747+00	f
9a0387da-534a-485c-93bb-3be74abd8216	sale	ae33a7ca-c3d2-493d-b914-bf3813d2269d	sale.completed	{"total": 20, "saleId": "ae33a7ca-c3d2-493d-b914-bf3813d2269d"}	t	2026-11-02 02:53:10.358535+00	0	2026-11-02 02:53:10.358535+00	f
8ecc6c48-3bce-4407-901e-f070a38f0dd9	sale	1a232430-4822-42c9-bfb3-0bc5a2ebf546	sale.completed	{"total": 60, "saleId": "1a232430-4822-42c9-bfb3-0bc5a2ebf546"}	t	2026-11-02 03:03:18.764167+00	0	2026-11-02 03:03:18.764167+00	f
754a5ea4-5b5e-472d-8744-f713f97fa40b	sale	2c53b92b-56c0-4947-bb9f-0609fff10c63	sale.completed	{"total": 20, "saleId": "2c53b92b-56c0-4947-bb9f-0609fff10c63"}	t	2026-11-02 03:03:18.811808+00	0	2026-11-02 03:03:18.811808+00	f
28afa445-e153-46fd-b6c1-95de2bd07f6d	sale	47b7247c-c5f8-499a-890f-4d9e89b28273	sale.completed	{"total": 60, "saleId": "47b7247c-c5f8-499a-890f-4d9e89b28273"}	t	2026-11-02 03:07:06.602648+00	0	2026-11-02 03:07:06.602648+00	f
e0f7a8b2-943f-4fd3-84aa-6ba7a79e02f4	sale	a8eca397-8904-46cc-aa47-f3194efca0cc	sale.completed	{"total": 20, "saleId": "a8eca397-8904-46cc-aa47-f3194efca0cc"}	t	2026-11-02 03:07:06.664489+00	0	2026-11-02 03:07:06.664489+00	f
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.payments (id, sale_id, method, amount, reference, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.permissions (id, code, description) FROM stdin;
\.


--
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.product_batches (id, product_id, warehouse_id, batch_number, quantity, expiry_date, cost_price, created_at) FROM stdin;
\.


--
-- Data for Name: product_suppliers; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.product_suppliers (id, product_id, supplier_id, cost_price, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.products (id, business_id, category_id, primary_supplier_id, sku, barcode, name, description, image_url, unit_of_measure, cost_price, sale_price, tax_rate, margin_percent, min_stock, is_active, created_at, updated_at) FROM stdin;
d017b391-966e-4948-a7d6-2ddb68b0406c	11111111-1111-1111-1111-111111111111	\N	\N	TEST-001	\N	Producto Test Multidispositivo		\N	unit	1000.0000	2500.0000	0.00	\N	5.0000	f	2026-11-02 02:05:22.641148+00	2026-11-02 02:40:38.213833+00
d9888c03-3358-4cfd-99c6-ad45f16fe64f	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 02:46:54.244887+00	2026-11-02 02:46:54.400205+00
8fd4897a-0640-431c-b59d-7659e237513b	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793587643411	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 02:47:23.418396+00	2026-11-02 02:47:23.430094+00
19d04b92-8dd8-40bd-97c5-bbabbc5c3d20	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793587648009	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 02:47:28.020553+00	2026-11-02 02:47:28.036887+00
495aa9b3-2c3c-432b-8951-b98a4678d9df	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793587686286	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 02:48:06.301039+00	2026-11-02 02:48:06.316545+00
c4038129-f26d-4288-a2cf-158134e3af5c	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793587990543	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 02:53:10.559674+00	2026-11-02 02:53:10.581836+00
e376f6be-abaa-4f0b-ac0c-aceb35088c57	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793588588298	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 03:03:08.319369+00	2026-11-02 03:03:08.348315+00
38075d58-9085-4de7-8013-bf59345ba17d	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793588592222	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 03:03:12.22801+00	2026-11-02 03:03:12.24003+00
3f832d8f-fcdb-41c1-8546-8c7e656b2c9d	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793588598936	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 03:03:18.944067+00	2026-11-02 03:03:18.954053+00
833281ff-4946-4208-a5c9-487c00c9d824	11111111-1111-1111-1111-111111111111	\N	\N	RBAC-TEST-1793588827104	\N	RBAC Product		\N	unit	0.0000	10.0000	0.00	\N	0.0000	f	2026-11-02 03:07:07.11972+00	2026-11-02 03:07:07.141552+00
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, quantity, unit_cost, tax_rate, received_quantity, created_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.purchase_orders (id, business_id, branch_id, supplier_id, status, subtotal, tax_total, total, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refund_items; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.refund_items (id, refund_id, sale_item_id, quantity, amount, created_at) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.refunds (id, sale_id, user_id, reason, total, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.roles (id, name, description, created_at) FROM stdin;
c2eaa8f0-76d2-47ee-b004-4e0c0199d1a0	admin	Administrador con acceso integral	2026-11-02 01:56:54.560312+00
53f36aa9-7aae-4079-81c2-428c744bf3d0	supervisor	Supervisor comercial	2026-11-02 01:56:54.560312+00
c04a3bcd-b447-4d97-b7b0-aa08faa2fb10	cashier	Cajero	2026-11-02 01:56:54.560312+00
ae9cb83d-4d62-453b-9e49-a631e67ebd8b	warehouse	Almacenista	2026-11-02 01:56:54.560312+00
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.sale_items (id, sale_id, product_id, batch_id, quantity, unit_price, discount, tax_rate, total, created_at) FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.sales (id, business_id, branch_id, warehouse_id, customer_id, cash_session_id, user_id, sale_number, status, subtotal, tax_total, discount_total, total, idempotency_key, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.suppliers (id, business_id, name, company, tax_id, phone, email, address, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.system_settings (id, business_id, key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: user_branch_access; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.user_branch_access (user_id, branch_id) FROM stdin;
44444444-4444-4444-4444-444444444444	22222222-2222-2222-2222-222222222222
99999999-9999-9999-9999-999999999999	22222222-2222-2222-2222-222222222222
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.user_devices (id, user_id, device_fingerprint, device_name, trusted, last_seen, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.user_roles (user_id, role_id) FROM stdin;
44444444-4444-4444-4444-444444444444	c2eaa8f0-76d2-47ee-b004-4e0c0199d1a0
99999999-9999-9999-9999-999999999999	c04a3bcd-b447-4d97-b7b0-aa08faa2fb10
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.user_sessions (id, user_id, device_id, device_name, ip_address, user_agent, token_hash, is_active, created_at, last_activity, revoked_at) FROM stdin;
5197d78a-4b72-4a27-8daa-46539cdc79da	44444444-4444-4444-4444-444444444444	\N	PC Principal	::1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26300; es-MX) PowerShell/7.6.9	05236237b4ea0bda5531b6a8c606118cd64a6d9b4fe0654e24fd009e2eb9fca0	t	2026-11-02 02:42:09.434829+00	2026-11-02 02:42:09.434829+00	\N
d0996a2f-7c1b-4a8d-bc0c-888c5fc6a99e	44444444-4444-4444-4444-444444444444	\N	PC Principal	::1	Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.26300; es-MX) PowerShell/7.6.9	496cc9aa9f765ad55abd69757bcfca4a0ea4b57995b0da235df8cb983074a9a1	t	2026-11-02 02:42:13.375786+00	2026-11-02 02:42:13.375786+00	\N
8101d7fa-86c7-425a-9e1f-b0438b3d3466	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	f84c43d7017d057577848768893d1bbe8de4b6709d4326d576618d6b49e888b5	t	2026-11-02 02:45:51.404415+00	2026-11-02 02:45:51.404415+00	\N
2f17484a-39e3-4fd1-baf8-9d08eef7be86	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	4fbd985a86ec0a3112bb83b3c6e733eafbde64f8b4a160017fb95000ed05c96d	t	2026-11-02 02:46:18.914308+00	2026-11-02 02:46:18.914308+00	\N
3e97db59-8381-4966-8e8b-f1a61fc91b2b	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	8ad30f9c518cddc1d07dc6c28914120be3ff09365cf98ea5e84002ea9dd33064	t	2026-11-02 02:46:54.089171+00	2026-11-02 02:46:54.089171+00	\N
f47b525b-4a0e-4971-b2bd-34f7693f0761	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	d203458eae0fc084f5ced39e8f4c0dc78217a08ac5fae9830007f34a4dbfa1ff	t	2026-11-02 02:46:54.721585+00	2026-11-02 02:46:54.721585+00	\N
502c1854-b457-4025-84cc-bfd15ecd4dbf	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	4b05451f9482645da1c9ecb92a9ab6df1fd256691ffbfe546f6f6d809a6bf7e9	t	2026-11-02 02:47:00.360631+00	2026-11-02 02:47:00.360631+00	\N
9eef6227-7be1-4bbc-a29c-0efeb685d4e1	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	40f733a8d5357c8c383300b4a0c04587fb001cc89c320ef8a465ee025b762799	t	2026-11-02 02:47:01.057197+00	2026-11-02 02:47:01.057197+00	\N
b1a0c4fd-7fe0-41b7-a990-2e5475b63b01	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	84f2c73554aa38699e4b2333aff55cfc138e425d1b3bfcd1d4e9ad0a31ed02ce	t	2026-11-02 02:47:07.756195+00	2026-11-02 02:47:07.756195+00	\N
8b067a32-d376-4299-bfc0-1366b9c96313	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	d773b9dd808a6bd9211d3521dda3311c3ef37f5fb0797f043968d9b18ae6a055	t	2026-11-02 02:47:08.449897+00	2026-11-02 02:47:08.449897+00	\N
6eee1a41-0de3-454c-910a-c39cd16afc9f	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	2a20ae185df5991f14ec7a6fae92a4ef41c0e69fbdd623df3bf436a840898cf9	t	2026-11-02 02:47:15.566769+00	2026-11-02 02:47:15.566769+00	\N
eb17fb75-4dd4-40af-92b6-d320ac8ccec4	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	2e811693e4b3d361dead5197511c1f819cd883360c21ec4db92fdff433acf9c7	t	2026-11-02 02:47:23.399088+00	2026-11-02 02:47:23.399088+00	\N
a41bbb94-c764-4efc-ab85-b7ed1141a5bc	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	3649d52ae2381b34aec3abe28eb3839d65eb26c391404e88f5899169cfa0c364	t	2026-11-02 02:47:23.757446+00	2026-11-02 02:47:23.757446+00	\N
b13de8d9-13a9-406e-a6f7-c27a67407dc5	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	48e04dd1b13d59ced8709f8c15137d11f61b4e9f265f2d33a55f717680e541f1	t	2026-11-02 02:47:27.993693+00	2026-11-02 02:47:27.993693+00	\N
b6126004-ba93-4547-b7e0-c34954529b84	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	16ad77f23be1fe694ce1d33dcf68649256f194eb6495dfcf797d96d331863aae	t	2026-11-02 02:47:28.497938+00	2026-11-02 02:47:28.497938+00	\N
e2ff0575-16be-468e-803f-4369e91ce7bb	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	6db1ab4c6d6ad08a01b237d9e33797ac3fe3da87cef731fa67bc588585dfafa3	t	2026-11-02 02:48:06.276874+00	2026-11-02 02:48:06.276874+00	\N
71842fbc-10d3-476a-ad30-8b2c05c2f312	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	9532f5f330576590fc0d2c96eecb81ea1c9be7bd2f3ce83c8a987accaad2977a	t	2026-11-02 02:48:06.599098+00	2026-11-02 02:48:06.599098+00	\N
5ba63a7f-99cf-40af-b0e6-9f803879659d	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	f8b9815572fb8d2192b0d3b0662d35e0ccda34d01a250143bbdf77f6f2761950	t	2026-11-02 02:53:10.519779+00	2026-11-02 02:53:10.519779+00	\N
703f1343-e129-4672-b272-60da2ef797ad	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	fade2cea74b0457055ffbf2744dd3a06682f13541aa490fc6806ae1229054c5d	t	2026-11-02 02:53:10.955087+00	2026-11-02 02:53:10.955087+00	\N
ff53b772-505d-42ef-bd2f-b55fb977da6d	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	d4834d33160eb128e4a86131c4839680754da0a15ad11ed3af242dd315541a9b	t	2026-11-02 03:03:08.276188+00	2026-11-02 03:03:08.276188+00	\N
a963acdc-4431-44cb-9811-d90ba133a817	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	90d9080fcd6be6ad3a3a3619e3d93c49f2ee674d863b3f17b314e544bb46e8ea	t	2026-11-02 03:03:08.624632+00	2026-11-02 03:03:08.624632+00	\N
a23bdae4-4b20-47b3-86f7-65cb124ca12c	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	a3d05706e31267b3fc4b8a30ab6051db7ad11161a32649abffde1422da497079	t	2026-11-02 03:03:12.215092+00	2026-11-02 03:03:12.215092+00	\N
618b7529-86f5-4bb3-bde4-71750b2b0e80	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	96af4c4dcb3bd3c9091eae753496aa7a56e69e41e3c798dab26fd605d92403d7	t	2026-11-02 03:03:12.504018+00	2026-11-02 03:03:12.504018+00	\N
72046b34-2156-4e4b-9ec1-877d7ddf8a79	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	916efc27e240205a2e522385bcadd76e7f00c1a3c676821a50796ebe10caf249	t	2026-11-02 03:03:18.928182+00	2026-11-02 03:03:18.928182+00	\N
ff63717c-4af4-4ea9-9f46-1e0af2c91403	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	69d3e2abf62470d0a06cb036cd134e92ed987eff020344ba4ce64ed1a4c9913f	t	2026-11-02 03:03:19.19972+00	2026-11-02 03:03:19.19972+00	\N
ec4057f1-0b55-449f-9e14-363e293f4464	44444444-4444-4444-4444-444444444444	\N	\N	::1	node	e04b4c514940676061c4dd491025b6cec6bae7da3bcfd23914da5e9d8ab25c31	t	2026-11-02 03:07:07.087462+00	2026-11-02 03:07:07.087462+00	\N
d10c7348-5cd1-4c87-9e2b-56a670f11c0b	99999999-9999-9999-9999-999999999999	\N	\N	::1	node	a18a57f259a7ce88450f6391053d35bbd05b73f76492cefd07979a49505fa551	t	2026-11-02 03:07:07.662714+00	2026-11-02 03:07:07.662714+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.users (id, business_id, email, password_hash, name, phone, is_active, created_at, updated_at) FROM stdin;
44444444-4444-4444-4444-444444444444	11111111-1111-1111-1111-111111111111	admin@erp.local	$2b$12$1KK3ddIMSVh2xhIw4ltZLeRPo3pNT3h0698Cayzp0YiA0IJ69iVU.	Administrador	\N	t	2026-11-02 01:56:54.582441+00	2026-11-02 01:56:54.582441+00
99999999-9999-9999-9999-999999999999	11111111-1111-1111-1111-111111111111	cashier@erp.local	$2b$12$zEE6qCGsHb7Ruu/AKrAgouMNH.Dx2qfv7pEx5rorkRMuJdgxTpmo2	Cajero Test	\N	t	2026-11-02 02:45:45.737242+00	2026-11-02 02:45:45.737242+00
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: erp
--

COPY public.warehouses (id, branch_id, name, is_default, created_at) FROM stdin;
33333333-3333-3333-3333-333333333333	22222222-2222-2222-2222-222222222222	Almacén Principal	t	2026-11-02 01:56:54.574761+00
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: cash_movements cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);


--
-- Name: cash_registers cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_pkey PRIMARY KEY (id);


--
-- Name: cash_sessions cash_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_pkey PRIMARY KEY (id);


--
-- Name: categories categories_business_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_business_id_slug_key UNIQUE (business_id, slug);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: goods_receipt_items goods_receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_pkey PRIMARY KEY (id);


--
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (key);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_product_id_warehouse_id_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_warehouse_id_key UNIQUE (product_id, warehouse_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_batches product_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_pkey PRIMARY KEY (id);


--
-- Name: product_suppliers product_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_pkey PRIMARY KEY (id);


--
-- Name: product_suppliers product_suppliers_product_id_supplier_id_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_product_id_supplier_id_key UNIQUE (product_id, supplier_id);


--
-- Name: products products_business_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_business_id_sku_key UNIQUE (business_id, sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: refund_items refund_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_business_id_key_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_business_id_key_key UNIQUE (business_id, key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_branch_access user_branch_access_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_pkey PRIMARY KEY (user_id, branch_id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_user_id_device_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_device_fingerprint_key UNIQUE (user_id, device_fingerprint);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_audit_business ON public.audit_logs USING btree (business_id);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_audit_date ON public.audit_logs USING btree (created_at);


--
-- Name: idx_batches_expiry; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_batches_expiry ON public.product_batches USING btree (expiry_date);


--
-- Name: idx_batches_product; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_batches_product ON public.product_batches USING btree (product_id);


--
-- Name: idx_branches_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_branches_business ON public.branches USING btree (business_id);


--
-- Name: idx_cash_mov_session; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_cash_mov_session ON public.cash_movements USING btree (cash_session_id);


--
-- Name: idx_cash_sessions_register; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_cash_sessions_register ON public.cash_sessions USING btree (cash_register_id);


--
-- Name: idx_cash_sessions_status; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_cash_sessions_status ON public.cash_sessions USING btree (status);


--
-- Name: idx_categories_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_categories_business ON public.categories USING btree (business_id);


--
-- Name: idx_customers_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_customers_business ON public.customers USING btree (business_id);


--
-- Name: idx_gr_po; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_gr_po ON public.goods_receipts USING btree (purchase_order_id);


--
-- Name: idx_gri_gr; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_gri_gr ON public.goods_receipt_items USING btree (goods_receipt_id);


--
-- Name: idx_inv_mov_date; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_inv_mov_date ON public.inventory_movements USING btree (created_at);


--
-- Name: idx_inv_mov_product; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_inv_mov_product ON public.inventory_movements USING btree (product_id);


--
-- Name: idx_inv_mov_type; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_inv_mov_type ON public.inventory_movements USING btree (movement_type);


--
-- Name: idx_inventory_product; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_inventory_product ON public.inventory USING btree (product_id);


--
-- Name: idx_inventory_warehouse; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_inventory_warehouse ON public.inventory USING btree (warehouse_id);


--
-- Name: idx_notif_user; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_notif_user ON public.notifications USING btree (user_id);


--
-- Name: idx_outbox_published; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_outbox_published ON public.outbox_events USING btree (published);


--
-- Name: idx_payments_sale; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_payments_sale ON public.payments USING btree (sale_id);


--
-- Name: idx_po_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_po_business ON public.purchase_orders USING btree (business_id);


--
-- Name: idx_po_status; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_po_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_poi_po; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_poi_po ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: idx_products_barcode; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);


--
-- Name: idx_products_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_products_business ON public.products USING btree (business_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- Name: idx_refunds_sale; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_refunds_sale ON public.refunds USING btree (sale_id);


--
-- Name: idx_sale_items_product; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sale_items_product ON public.sale_items USING btree (product_id);


--
-- Name: idx_sale_items_sale; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sale_items_sale ON public.sale_items USING btree (sale_id);


--
-- Name: idx_sales_branch; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sales_branch ON public.sales USING btree (branch_id);


--
-- Name: idx_sales_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sales_business ON public.sales USING btree (business_id);


--
-- Name: idx_sales_date; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sales_date ON public.sales USING btree (created_at);


--
-- Name: idx_sales_idempotency; Type: INDEX; Schema: public; Owner: erp
--

CREATE UNIQUE INDEX idx_sales_idempotency ON public.sales USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: idx_sales_user; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_sales_user ON public.sales USING btree (user_id);


--
-- Name: idx_suppliers_business; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_suppliers_business ON public.suppliers USING btree (business_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_user; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_user_sessions_user ON public.user_sessions USING btree (user_id);


--
-- Name: idx_warehouses_branch; Type: INDEX; Schema: public; Owner: erp
--

CREATE INDEX idx_warehouses_branch ON public.warehouses USING btree (branch_id);


--
-- Name: audit_logs audit_logs_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branches branches_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: cash_movements cash_movements_cash_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE CASCADE;


--
-- Name: cash_movements cash_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cash_registers cash_registers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: cash_sessions cash_sessions_cash_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id) ON DELETE RESTRICT;


--
-- Name: cash_sessions cash_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.cash_sessions
    ADD CONSTRAINT cash_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: categories categories_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: customers customers_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: sales fk_sales_cash_session; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_cash_session FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id) ON DELETE SET NULL;


--
-- Name: goods_receipt_items goods_receipt_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(id) ON DELETE SET NULL;


--
-- Name: goods_receipt_items goods_receipt_items_goods_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_goods_receipt_id_fkey FOREIGN KEY (goods_receipt_id) REFERENCES public.goods_receipts(id) ON DELETE CASCADE;


--
-- Name: goods_receipt_items goods_receipt_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: goods_receipt_items goods_receipt_items_purchase_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipt_items
    ADD CONSTRAINT goods_receipt_items_purchase_order_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id) ON DELETE RESTRICT;


--
-- Name: goods_receipts goods_receipts_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE RESTRICT;


--
-- Name: goods_receipts goods_receipts_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: goods_receipts goods_receipts_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;


--
-- Name: inventory_movements inventory_movements_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: inventory_movements inventory_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: product_batches product_batches_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_batches product_batches_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_batches
    ADD CONSTRAINT product_batches_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: product_suppliers product_suppliers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_suppliers product_suppliers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: products products_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_primary_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_primary_supplier_id_fkey FOREIGN KEY (primary_supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: purchase_orders purchase_orders_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;


--
-- Name: refund_items refund_items_refund_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_refund_id_fkey FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE CASCADE;


--
-- Name: refund_items refund_items_sale_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refund_items
    ADD CONSTRAINT refund_items_sale_item_id_fkey FOREIGN KEY (sale_item_id) REFERENCES public.sale_items(id) ON DELETE RESTRICT;


--
-- Name: refunds refunds_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE RESTRICT;


--
-- Name: refunds refunds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: sale_items sale_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.product_batches(id) ON DELETE SET NULL;


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: sales sales_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales sales_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;


--
-- Name: suppliers suppliers_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: user_branch_access user_branch_access_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: user_branch_access user_branch_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict rPyX4xdSkVzgziV28iPhcFUpcvH56Q866hRlt526kNToAaGa2EAxPIYCusevjbL

