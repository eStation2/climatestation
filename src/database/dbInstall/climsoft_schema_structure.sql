SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


CREATE SCHEMA climsoft;
ALTER SCHEMA climsoft OWNER TO estation;

SET search_path = climsoft, pg_catalog;

SET default_with_oids = false;

CREATE TABLE IF NOT EXISTS climsoft.station (
  stationId varchar(255) NOT NULL,
  stationName varchar(255) DEFAULT NULL,
  wmoid varchar(20) DEFAULT NULL,
  icaoid varchar(20) DEFAULT NULL,
  latitude decimal(11,6) DEFAULT NULL,
  qualifier varchar(20) DEFAULT NULL,
  longitude decimal(11,6) DEFAULT NULL,
  elevation varchar(255) DEFAULT NULL,
  geoLocationMethod varchar(255) DEFAULT NULL,
  geoLocationAccuracy decimal(11,6) DEFAULT NULL,
  openingDatetime varchar(50) DEFAULT NULL,
  closingDatetime varchar(50) DEFAULT NULL,
  country varchar(50) DEFAULT NULL,
  authority varchar(255) DEFAULT NULL,
  adminRegion varchar(255) DEFAULT NULL,
  drainageBasin varchar(255) DEFAULT NULL,
  wacaSelection smallint DEFAULT '0',
  cptSelection smallint DEFAULT '0',
  stationOperational smallint DEFAULT '0',
  CONSTRAINT station_pk PRIMARY KEY (stationId)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE climsoft.station
  OWNER TO estation;


CREATE TABLE IF NOT EXISTS climsoft.obselement (
  elementId bigint NOT NULL DEFAULT '0',
  abbreviation varchar(255) DEFAULT NULL,
  elementName varchar(255) DEFAULT NULL,
  description varchar(255) DEFAULT NULL,
  elementScale decimal(8,2) DEFAULT NULL,
  upperLimit varchar(255) DEFAULT NULL,
  lowerLimit varchar(255) DEFAULT NULL,
  units varchar(255) DEFAULT NULL,
  elementtype varchar(50) DEFAULT NULL,
  qcTotalRequired integer DEFAULT '0',
  selected smallint NOT NULL DEFAULT '0',
  CONSTRAINT obselement_pk PRIMARY KEY (elementId)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE climsoft.obselement
  OWNER TO estation;


CREATE TABLE IF NOT EXISTS climsoft.observationfinal
(
  recordedFrom varchar(255) NOT NULL,
  describedBy bigint DEFAULT NULL,
  obsDatetime date DEFAULT NULL,
  obsLevel varchar(255) DEFAULT 'surface',
  obsValue decimal(8,2) DEFAULT NULL,
  flag varchar(255) DEFAULT 'N',
  period integer DEFAULT NULL,
  qcStatus integer DEFAULT '0',
  qcTypeLog text,
  acquisitionType integer DEFAULT '0',
  dataForm varchar(255) DEFAULT NULL,
  capturedBy varchar(255) DEFAULT NULL,
  mark smallint DEFAULT NULL,
  temperatureUnits varchar(255) DEFAULT NULL,
  precipitationUnits varchar(255) DEFAULT NULL,
  cloudHeightUnits varchar(255) DEFAULT NULL,
  visUnits varchar(255) DEFAULT NULL,
  dataSourceTimeZone integer DEFAULT '0',

  CONSTRAINT observationfinal_pk PRIMARY KEY (recordedFrom,describedBy,obsDatetime),
  CONSTRAINT obselement_observationFinal_fk FOREIGN KEY (describedBy)
      REFERENCES climsoft.obselement (elementId) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT station_observationFinal_fk FOREIGN KEY (recordedFrom)
      REFERENCES climsoft.station (stationId) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);
ALTER TABLE climsoft.observationfinal
  OWNER TO estation;


