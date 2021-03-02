CREATE TABLE IF NOT EXISTS products.product_new
(
    productcode character varying COLLATE pg_catalog."default" NOT NULL,
    version character varying COLLATE pg_catalog."default" NOT NULL,
    defined_by character varying COLLATE pg_catalog."default" NOT NULL,
    activated boolean NOT NULL DEFAULT false,
    category_id character varying COLLATE pg_catalog."default" NOT NULL,
    descriptive_name character varying(255) COLLATE pg_catalog."default",
    description character varying COLLATE pg_catalog."default",
    provider character varying COLLATE pg_catalog."default",
    masked boolean NOT NULL,
    CONSTRAINT unq_product_new_productcode UNIQUE (productcode, version),
    CONSTRAINT product_category_product_fk_0 FOREIGN KEY (category_id)
        REFERENCES products.product_category (category_id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE products.product_new
    OWNER to estation;

COMMENT ON COLUMN products.product_new.defined_by
    IS 'values: JRC or USER';

COMMENT ON COLUMN products.product_new.descriptive_name
    IS 'A clear and descriptive name of the product.';


-- Table: products.sub_product

-- DROP TABLE products.sub_product;

CREATE TABLE IF NOT EXISTS products.sub_product
(
    productcode character varying COLLATE pg_catalog."default" NOT NULL,
    subproductcode character varying COLLATE pg_catalog."default" NOT NULL,
    version character varying COLLATE pg_catalog."default" NOT NULL,
    defined_by character varying COLLATE pg_catalog."default" NOT NULL,
    product_type character varying COLLATE pg_catalog."default",
    descriptive_name character varying(255) COLLATE pg_catalog."default",
    description character varying COLLATE pg_catalog."default",
    frequency_id character varying COLLATE pg_catalog."default" NOT NULL,
    date_format character varying COLLATE pg_catalog."default" NOT NULL,
    scale_factor double precision,
    scale_offset double precision,
    nodata bigint,
    mask_min double precision,
    mask_max double precision,
    unit character varying COLLATE pg_catalog."default",
    data_type_id character varying COLLATE pg_catalog."default" NOT NULL,
    masked boolean NOT NULL,
    timeseries_role character varying COLLATE pg_catalog."default",
    display_index integer,
    CONSTRAINT product_pk_1 PRIMARY KEY (productcode, subproductcode, version),
    CONSTRAINT data_type_product_fk_0 FOREIGN KEY (data_type_id)
        REFERENCES products.data_type (data_type_id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT datetype_product_fk_0 FOREIGN KEY (date_format)
        REFERENCES products.date_format (date_format) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT distribution_frequency_product_fk_0 FOREIGN KEY (frequency_id)
        REFERENCES products.frequency (frequency_id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT fk_sub_product_product_new FOREIGN KEY (productcode, version)
        REFERENCES products.product_new (productcode, version) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE products.sub_product
    OWNER to estation;

COMMENT ON COLUMN products.sub_product.defined_by
    IS 'values: JRC or USER';

COMMENT ON COLUMN products.sub_product.product_type
    IS 'A product can be of type Native, Ingest or Derived.';

COMMENT ON COLUMN products.sub_product.descriptive_name
    IS 'A clear and descriptive name of the product.';

COMMENT ON COLUMN products.sub_product.frequency_id
    IS 'A string, case insensitive, indicating the time-span that the product represents (is distributed): \nundefined\nINSTANTANEOUS\nDEKAD!=10-days\n8days\n1month\n1week\n24hours (for MSG products)\n1year';

COMMENT ON COLUMN products.sub_product.date_format
    IS 'A string, case insensitive, in YYYYMMDD, YYYYMMDDHHMM,YYYY,MMDD,HHMM. HHMM (may be used for MSG 15 minutes synthesis). This list may change with the project life. It is maintained by JRC';

COMMENT ON COLUMN products.sub_product.timeseries_role
    IS 'Defines the role of the product in TS:\n<empty> or Null -> not considered\n''Initial'' -> it is represented as ''base'' TS (YYYYMMDD date type)\n<subproductcode> -> it is represented as ''derived'' from the <subproductcode> (which must be ''Initial'')';



insert into products.product_new
select productcode, version, defined_by, activated, category_id, descriptive_name, description, provider, masked
from products.product
where product_type = 'Native';


insert into products.sub_product
select productcode,
	subproductcode,
	version,
	defined_by,
	product_type,
	descriptive_name,
	description,
	frequency_id,
	date_format,
	scale_factor,
	scale_offset,
	nodata,
	mask_min,
	mask_max,
	unit,
	data_type_id,
	masked,
	timeseries_role,
	display_index
from products.product
where product_type != 'Native';





