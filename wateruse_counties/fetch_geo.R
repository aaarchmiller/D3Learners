library(sf)
library(dplyr)

#### water use data ####

# write simple versions of the water use data, making up data for each year
wateruse <- readxl::read_xlsx('usco2015-MockData-dataviz.xlsx', sheet=1, skip=1, na='N/A')
datadict <- readxl::read_xlsx('usco2015-MockData-dataviz.xlsx', sheet=2)
# pick 6 variables that tell some sort of story (though not nearly a complete one)
vars_simple <- datadict %>%
  filter(
    grepl("^.+\\-.+", `Column Tag`), # remove STATE, YEAR, etc
    !grepl("Pop$", `Column Tag`), # remove population estimates
    grepl('(Public Supply)|(Domestic)|(Industrial)', Attribute), # just pick a few categories
    grepl('(, total,)|(Domestic, self-supplied)', Attribute),
    !grepl('per capita', Attribute)
  )
# subset wateruse
wateruse_simple <- wateruse %>%
  filter(substr(FIPS, 1, 2) %in% c('04','55')) %>%
  .[c('COUNTY', 'FIPS', 'YEAR', 'PS-TOPop', vars_simple$'Column Tag')] %>%
  mutate(COUNTY = sapply(strsplit(COUNTY, ' '), `[[`, 1))
wateruse_timeseries <- bind_rows(lapply(seq(1950, 2015, by=5), function(y) {
  wu <- wateruse_simple %>%
    mutate(YEAR = as.character(y))
  for(col in vars_simple$`Column Tag`) {
    wu[[col]] <- wu[[col]] * runif(n=nrow(wu), min=0.5, max=2)
  }
  wu
}))
jsonlite::write_json(wateruse_timeseries, 'wateruse.json')
jsonlite::write_json(vars_simple, 'datadict.json')


#### NHGIS county boundaries ####

# Manual download from NHGIS/IPUMS on 12/10/17:
# Extract: nhgis0001
# Link: http://data2.nhgis.org/downloads
# Description: 5-10 year intervals, mostly TIGER 2008
big_zip <- 'nhgis0001_shape.zip'

# unpack into one shapefile per year (1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015)
decade_zips <- unzip(big_zip, exdir='.')
lapply(decade_zips, function(dec_zip) {
  unzip(dec_zip, exdir=tools::file_path_sans_ext(dec_zip))
  file.remove(dec_zip)
});

# read all the country-wide shapefiles into R
dec_dirs <- dir(tools::file_path_sans_ext(big_zip), full.names=TRUE)
dec_dirs <- setNames(dec_dirs, substring(dec_dirs, nchar(dec_dirs) - 3))
decade_shps <- lapply(dec_dirs[c(1,4,7)], function(dec_dir) { # subset to 3 shapefiles for demo
  decfiles <- dir(dec_dir, full.names=TRUE)
  shpfile <- decfiles[grep('\\.shp$', decfiles)]
  layer <- st_layers(shpfile)$name
  countyst <- st_read(shpfile, layer=layer, stringsAsFactors=FALSE)
})
# split the country-wide shapefiles into state-wide shapefiles and attach IDs
fips_codes <- dataRetrieval::stateCd %>% rename(STATEFP10=STATE)
split_shps <- lapply(setNames(nm=names(decade_shps)), function(dec_shp_nm) {
  message(dec_shp_nm)
  dec_shp <- decade_shps[[dec_shp_nm]]
  # create a single ID, STATEFP10, on which things can be merged across decades
  states <- dec_shp %>%
    as_data_frame() %>%
    mutate(
      STATEFP10 = if(exists('STATEFP10')) STATEFP10 else 
        ifelse(substr(NHGISST, 3, 3)=='0', substr(NHGISST, 1, 2), NHGISST),
      STATENAM = if(exists('STATENAM')) STATENAM else NA) %>%
    select(STATENAM, STATEFP10) %>%
    group_by(STATEFP10) %>%
    summarize(STATENAM=STATENAM[1]) %>%
    rename(STATE_NAME=STATENAM)
  
  # augment fips_codes with any new 'states' (territories) from this shapefile
  if(all(is.na(states$STATE_NAME))) {
    fips_codes <- full_join(fips_codes, select(states, -STATE_NAME), by='STATEFP10')
  } else {
    fips_codes <- full_join(fips_codes, states, by=c('STATEFP10','STATE_NAME'))
  }
  if(fips_codes %>% group_by(STATEFP10, STATE_NAME) %>% count() %>% pull(n) %>% {any(. != 1)}) {
    stop('oops, ended up with duplicate/conflicting STATEFP10 and/or STATE_NAME in fips_codes')
  }
  
  # augment dec_shp so it has fewer properties and the same properties across decades
  if(exists('STATENAM', dec_shp)) {
    dec_shp <- left_join(dec_shp, select(fips_codes, STATEFP10, STATE_NAME), by=c('STATENAM'='STATE_NAME')) %>%
      mutate(COUNTYFP10=substr(COUNTY, 1, 3)) %>%
      select(STATE_NAME=STATENAM, STATEFP10, COUNTY_NAME=NHGISNAM, COUNTYFP10)
  } else if(exists('STATEFP10', dec_shp)) {
    dec_shp <- left_join(dec_shp, select(fips_codes, STATEFP10, STATE_NAME), by='STATEFP10') %>%
      select(STATE_NAME, STATEFP10, COUNTY_NAME=NAME10, COUNTYFP10)
  } else {
    stop('unfamiliar shapefile format')
  }

  # create a subset of the data for each [selected] state
  states <- states %>%
    filter(STATEFP10 %in% c('04', '55')) # subset to Arizona (04) & Wisconsin (55) for demo
  lapply(setNames(nm=states$STATEFP10), function(statefip) {
    dec_shp %>% filter(STATEFP10 == statefip)
  })
})

# transpose so we have lists by state rather than by decade (in case we
# eventually combine each state's shapefiles into a single file)
state_shps <- purrr::transpose(split_shps)

# write out the files. for now, write them as separate files
shp_dict <- lapply(setNames(nm=names(state_shps)), function(fip) {
  bind_rows(lapply(names(state_shps[[fip]]), function(year) {
    # simplify and transform back to lat-long (maybe for efficiency we should do
    # the projection here rather than in the browser in the future)
    shp <- state_shps[[fip]][[year]]
    simple_shp <- sf::st_simplify(shp, preserveTopology=TRUE, dTolerance=200)
    latlon_shp <- sf::st_transform(simple_shp, sf::st_crs("+proj=longlat +ellps=WGS84 +no_defs"))
    
    # could add in the water use data here
    
    # write out the file
    outfile <- sprintf("%s_%s.geojson", fip, year)
    if(file.exists(outfile)) file.remove(outfile)
    sf::st_write(latlon_shp, dsn=outfile)
    
    # return the list of counties
    latlon_shp %>% as_data_frame() %>% select(-geometry) %>% mutate(YEAR=year)
  }))
})



# proj.string <- "+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +a=6370997 +b=6370997 +units=m +no_defs"

# #### GDP + sf ####
# library(httr)
# query <- 'http://cida.usgs.gov/gdp/geoserver/wfs?service=WFS&request=GetFeature&typeName=derivative:US_Counties&outputFormat=shape-zip&version=1.0.0'
# file <- GET(query, write_disk('counties.zip', overwrite=T), progress())
# unzipped <- unzip('counties.zip', exdir='counties')
# shpfile <- grep("shp", unzipped, value=TRUE)
# 
# library(sf)
# st_layers(shpfile)
# countyst <- st_read(shpfile, layer='US_Counties', stringsAsFactors=FALSE)
# plot(countyst[!countyst$STATE %in% c('VI','PR'),'STATE'])
# 
# library(dplyr)
# cdf <- countyst %>%
#   mutate(
#     lon=lapply(geometry, function(ct) mean(ct[[1]][,1])),
#     lat=lapply(geometry, function(ct) mean(ct[[1]][,2]))) %>%
#   filter(-130 < lon, lon < 0) %>%
#   select(STATE)
# cdf_t <- st_transform(cdf, proj.string)
# plot(cdf_t, graticule=st_crs(cdf), axes=TRUE)
# 
# #### maps + sp ####
# library(maps)
# library(sp)
# library(maptools)
# map <- maps::map('county', fill=TRUE, plot = FALSE)
# IDs <- sapply(strsplit(map$names, ":"), function(x) x[1])
# map.sp <- map2SpatialPolygons(map, IDs=IDs, proj4string=CRS("+proj=longlat +datum=WGS84"))
# map.sp.t <- spTransform(map.sp, CRS(proj.string))
# plot(map.sp.t)

# #### historical county boundaries ####
# library(httr)
# library(sf)
# download_counties <- function(state) {
#   url <- sprintf('http://publications.newberry.org/ahcbp/downloads/gis/%s_AtlasHCB.zip', state)
#   file <- httr::GET(url, write_disk(sprintf('%s/counties_%s.zip', tempdir(), state), overwrite=T), progress())
#   unzip(unclass(file$content), exdir=sprintf('counties_%s', state))
#   
#   shpfile <- sprintf('counties_%s/%s_AtlasHCB/%s_Historical_Counties/%s_Historical_Counties.shp', state, state, state, state)
#   layer <- st_layers(shpfile)$name
#   countyst <- st_read(shpfile, layer=layer, stringsAsFactors=FALSE)
# }
# 
# countyst <- download_counties('AZ')
# # overlap <- gContains(footy, counties, byid = TRUE) %>% rowSums() %>% as.logical()
# # counties <- SpatialPolygonsDataFrame(counties[overlap, ], 
# #                                      data = data.frame(FIPS=FIPs[overlap], countyName = countyName[overlap]), 
# #                                      match.ID = FALSE)
# counties <- countyst %>%
#   filter(STATE == 'AZ')
# 
# # function to figure out whether a distinct county set already exists and in
# # which position
# match_set <- function(set, sets) {
#   id <- NA
#   for(i in rev(seq_along(sets))) {
#     if(isTRUE(all.equal(set, sets[[i]]))) {
#       id <- i
#       break
#     }
#   }
#   return(id)
# }
# 
# # create a list of the unique county_sets over the 5-year intervals of the water census
# county_sets <- list()
# set_ids <- lapply(setNames(nm=seq(1950,2020,by=5)), function(y) {
#   date <- as.Date(sprintf('%s-01-01', y))
#   # seems that the dataset stops at end_date of 2000-12-31 - what happens after
#   # that? have counties remained unchanged?
#   set <- counties[counties$START_DATE < date & min(date, as.Date('2000-12-01')) <= counties$END_DATE,]
#   set_id <- match_set(set, county_sets)
#   if(is.na(set_id)) {
#     set_id <- length(county_sets) + 1
#     county_sets[[set_id]] <<- set
#   } 
#   return(set_id)
# })
# 
# # check that the sets are believable
# for(y in names(set_ids)) {
#   set <- county_sets[[set_ids[[y]]]]
#   plot(set[, 'FULL_NAME'], main=y)
#   Sys.sleep(0.5)
# }
# 
# # write out the county sets and the IDs
# for(i in seq_along(county_sets)) {
#   outfile <- sprintf("%s_%d.geojson", state, i)
#   st_write(county_sets[[i]], dsn=outfile)
# }
# set_id_df <- data_frame(year=as.integer(names(set_ids)), county_set=as.integer(unlist(set_ids)))
# jsonlite::write_json(set_id_df, 'shpdict.json')

