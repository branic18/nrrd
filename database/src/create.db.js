const args =  require('commander')

args
  .option('--duplicates', 'Enable/disable duplicates', true)
  .option('--no-duplicates', 'Enable/disable duplicates')
  .option('-f, --file <file>', 'CSV file to load')
  .option('--password <password>', 'DB PASSWORD')
  .option('--port <port>', 'DB PORT')
  .option('--user <port>', 'DB USER')
  .parse(process.argv)

let DB_PASSWORD = ''
if (args.password) {
  DB_PASSWORD = args.password
}
else if (process.env.DB_PASSWORD) {
  DB_PASSWORD = process.env.DB_PASSWORD
}
else {
  console.warn('No database password use command line option or set DB_PASSWORD variable')
  process.exit()
}

let DB_PORT = 7222
if (args.port) {
  DB_PORT = args.port
}
else if (process.env.DB_PORT) {
  DB_PORT = process.env.DB_PORT
}


let DB_USER = 'postgres'
if (args.database) {
  DB_USER = args.user
}
else if (process.env.DB_USER) {
  DB_USER = process.env.DB_USER
}

let DB_DATABASE = 'postgres'
if (args.database) {
  DB_DATABASE = args.database
}
else if (process.env.DB_DATABASE) {
  DB_DATABASE = process.env.DB_DATABASE
}

let DB_HOST = 'localhost'
if (args.host) {
  DB_HOST = args.host
}
else if (process.env.DB_HOST) {
  DB_HOST = process.env.DB_HOST
}


const { Pool, Client } = require('pg')
const db = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: DB_PORT,
  schema: 'public'
})

const main = async () => {
//    db.query('select * from foo', (err, res) => {
//	console.log(err, res)
  // db.end()
  //    });
  await commodity_table()
  await location_table()
  await period_table()
  await revenue_table()
  await disbursement_table()
  await production_table()
  await revenue_trends()
}

const production_table = async () => {
  const table = `
CREATE TABLE  IF NOT EXISTS
production( 
  location_id integer references location, 
  period_id integer references period, 
  commodity_id integer references commodity, 
  volume numeric,
  raw_volume varchar(255),
  unit varchar(255),
  unit_abbr varchar(255),
  duplicate_no integer default 0, 
  primary key (location_id, period_id, commodity_id, duplicate_no)
  
)
`
  try {
    await db.query(table)
  }
  catch (err) {
    console.log('disbursement_table: ', err)
  }
}

const disbursement_table = async () => {
  const table = `
CREATE TABLE  IF NOT EXISTS
disbursement( 
  location_id integer references location, 
  period_id integer references period, 
  commodity_id integer references commodity, 
  disbursement numeric,
  raw_disbursement varchar(255),
  unit varchar(20) default 'dollars',
  unit_abbr varchar(5) default '$',
  duplicate_no integer default 0, 
  primary key (location_id, period_id, commodity_id, duplicate_no)
  
)
`
  try {
    await db.query(table)
  }
  catch (err) {
    console.log('disbursement_table: ', err)
  }
}

const revenue_table = async () => {
  const table = `
CREATE TABLE  IF NOT EXISTS
revenue( 
  location_id integer references location, 
  period_id integer references period, 
  commodity_id integer references commodity, 
  revenue numeric,
  raw_revenue varchar(255),
  unit varchar(20) default 'dollars',
  unit_abbr varchar(5) default '$',
  duplicate_no integer default 0, 
  primary key (location_id, period_id, commodity_id, duplicate_no)
  
)
`
  try {
    await db.query(table)
  }
  catch (err) {
    console.log('revenue_table: ', err)
  }
}

const period_table = async () => {
  const table = `
CREATE TABLE  IF NOT EXISTS
period(
  period_id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, 
  period varchar(255),
  calendar_year integer,
  fiscal_year integer, 
  month integer, 
  month_long varchar(255),
  fiscal_month integer, 
  period_date date,
  UNIQUE(period,calendar_year,fiscal_year,month, month_long,fiscal_month, period_date)
)

`

  try {
    await db.query(table)
  }
  catch (err) {
    console.log('revenue_table: ', err)
  }
}

const commodity_table = async () => {
  const table = `
CREATE TABLE  IF NOT EXISTS
commodity(
  commodity_id  int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, 
  product varchar(255), 
  commodity varchar(255),  
  revenue_type varchar(255),
  revenue_category varchar(255), 
  mineral_lease_type varchar(255), 
  disbursement_type varchar(255),
  fund_type varchar(255),
  disbursement_category varchar(255),
  source varchar(255), 
  UNIQUE(product,commodity,revenue_type,revenue_category, mineral_lease_type,disbursement_type,fund_type,disbursement_category)
)
`
  try {
    await db.query(table)
  }
  catch (err) {
    console.log('revenue_table: ', err)
  }
}

const location_table = async () => {
  const table = `
CREATE TABLE IF NOT EXISTS
location (
   location_id  int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, 
   location_name varchar(255),
   fips_code  varchar(5), 
   state varchar(255),
   state_name varchar(255),  
   county varchar(255),  
   land_class varchar(255),
   land_category varchar(255) , 
   offshore_region varchar(255), 
   offshore_planning_area varchar(255),
   offshore_planning_area_code varchar(3), 
   offshore_block varchar(255), 
   offshore_protraction varchar (255), 
   UNIQUE(fips_code,state,county,land_class,land_category,offshore_region,offshore_planning_area,offshore_planning_area_code,offshore_block,offshore_protraction)
)
`
  try {
    await db.query(table)
  }
  catch (err) {
    console.log('revenue_table: ', err)
  }
}

const revenue_trends = async () => {
  const view = `
CREATE OR REPLACE VIEW  
revenue_trends as
select fiscal_year, 
       case when (revenue_type='Other Revenues' or revenue_type='Civil Penalties' or revenue_type='Inspection Fees') then 'Other Revenues' else  revenue_type end as trend_type,  
       (select month_long from period where period_date=(select max(period_date) from period where period_date <= '2019-07-01')) as current_month,
       sum(case when fiscal_month <= (select fiscal_month from period where period_date=(select max(period_date) from period where period_date <= '2019-07-01' )) then revenue else 0 end) as total_ytd, 
       sum(revenue) as total 
from revenue 
  natural join period 
  natural join commodity 
where commodity is not null
and period_date <= '2019-07-01'
group by fiscal_year, trend_type

union 
select fiscal_year,  
       'All Revenue' as trend_type,
       (select month_long from period where period_date=(select max(period_date) from period where period_date <= '2019-07-01' )) as current_month,
       sum(case when fiscal_month <= (select fiscal_month from period where period_date=(select max(period_date) from period where period_date <= '2019-07-01')) then revenue else 0 end) as total_ytd, 
       sum(revenue) as total 
from revenue natural join period natural join commodity 
where commodity is not null and  period_date <= '2019-07-01'
group by fiscal_year;

`

  try {
    db.query(view)
  }
  catch (err) {
    console.debug('revenue_trends ERROR ', err.stack)
  }
}

main()

/* for  updating location manual

update location set offshore_planning_area_code='ALA'  where offshore_planning_area=    'Aleutian Arc';
update location set offshore_planning_area_code='ALB'  where offshore_planning_area=    'Aleutian Basin';
update location set offshore_planning_area_code='BFT'  where offshore_planning_area=    'Beaufort Sea';
update location set offshore_planning_area_code='BOW'   whe  re offshore_planning_area=    'Bowers Basin';
update location set offshore_planning_area_code='CHU'  where offshore_planning_area=    'Chukchi Sea';
update location set offshore_planning_area_code='COK'  where offshore_planning_area=    'Cook Inlet';
update location set offshore_planning_area_code='GEO'  where offshore_planning_area=    'St. George Basin';
update location set offshore_planning_area_code='GOA'  where offshore_planning_area=    'Gulf of Alaska';
update location set offshore_planning_area_code='HOP'  where offshore_planning_area=    'Hope Basin';
update location set offshore_planning_area_code='KOD'  where offshore_planning_area=    'Kodiak';
update location set offshore_planning_area_code='MAT'  where offshore_planning_area=    'St. Matthew-Hall';
update location set offshore_planning_area_code='NAL'  where offshore_planning_area=    'North Aleutian Basin';
update location set offshore_planning_area_code='NAV'  where offshore_planning_area=    'Navarin Basin';
update location set offshore_planning_area_code='NOR'  where offshore_planning_area=    'Norton Basin';
update location set offshore_planning_area_code='SHU'  where offshore_planning_area=    'Shumagin';
update location set offshore_planning_area_code='FLS'  where offshore_planning_area=    'Florida Straits';
update location set offshore_planning_area_code='MDA'  where offshore_planning_area=    'Mid Atlantic';
update location set offshore_planning_area_code='NOA'  where offshore_planning_area=    'North Atlantic';
update location set offshore_planning_area_code='SOA'  where offshore_planning_area=    'South Atlantic';
update location set offshore_planning_area_code='WGM'  where offshore_planning_area=    'Western Gulf of Mexico';
update location set offshore_planning_area_code='CGM'  where offshore_planning_area=    'Central Gulf of Mexico';
update location set offshore_planning_area_code='EGM'  where offshore_planning_area=    'Eastern Gulf of Mexico';
update location set offshore_planning_area_code='CEC'  where offshore_planning_area=    'Central California';
update location set offshore_planning_area_code='NOC'  where offshore_planning_area=    'Northern California';
update location set offshore_planning_area_code='SOC'  where offshore_planning_area=    'Southern California';
update location set offshore_planning_area_code='WAO'  where offshore_planning_area=    'Washington-Oregon';

*/
