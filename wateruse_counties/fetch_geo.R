proj.string <- "+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +a=6370997 +b=6370997 +units=m +no_defs"

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
cdf <- countyst %>%
  mutate(
    lon=lapply(geometry, function(ct) mean(ct[[1]][,1])),
    lat=lapply(geometry, function(ct) mean(ct[[1]][,2]))) %>%
  filter(-130 < lon, lon < 0) %>%
  select(STATE)
cdf_t <- st_transform(cdf, proj.string)
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

#### historical county boundaries ####
library(httr)
library(sf)
download_counties <- function(state) {
  url <- sprintf('http://publications.newberry.org/ahcbp/downloads/gis/%s_AtlasHCB.zip', state)
  file <- httr::GET(url, write_disk(sprintf('%s/counties_%s.zip', tempdir(), state), overwrite=T), progress())
  unzip(unclass(file$content), exdir=sprintf('counties_%s', state))
  
  shpfile <- sprintf('counties_%s/%s_AtlasHCB/%s_Historical_Counties/%s_Historical_Counties.shp', state, state, state, state)
  layer <- st_layers(shpfile)$name
  countyst <- st_read(shpfile, layer=layer, stringsAsFactors=FALSE)
}

countyst <- download_counties('AZ')
# overlap <- gContains(footy, counties, byid = TRUE) %>% rowSums() %>% as.logical()
# counties <- SpatialPolygonsDataFrame(counties[overlap, ], 
#                                      data = data.frame(FIPS=FIPs[overlap], countyName = countyName[overlap]), 
#                                      match.ID = FALSE)
counties <- countyst %>%
  filter(STATE == 'AZ')

# function to figure out whether a distinct county set already exists and in
# which position
match_set <- function(set, sets) {
  id <- NA
  for(i in rev(seq_along(sets))) {
    if(isTRUE(all.equal(set, sets[[i]]))) {
      id <- i
      break
    }
  }
  return(id)
}

# create a list of the unique county_sets over the 5-year intervals of the water census
county_sets <- list()
set_ids <- lapply(setNames(nm=seq(1950,2020,by=5)), function(y) {
  date <- as.Date(sprintf('%s-01-01', y))
  # seems that the dataset stops at end_date of 2000-12-31 - what happens after
  # that? have counties remained unchanged?
  set <- counties[counties$START_DATE < date & min(date, as.Date('2000-12-01')) <= counties$END_DATE,]
  set_id <- match_set(set, county_sets)
  if(is.na(set_id)) {
    set_id <- length(county_sets) + 1
    county_sets[[set_id]] <<- set
  } 
  return(set_id)
})

# check that the sets are believable
for(y in names(set_ids)) {
  set <- county_sets[[set_ids[[y]]]]
  plot(set[, 'FULL_NAME'], main=y)
  Sys.sleep(0.5)
}

# write out the county sets and the IDs
for(i in seq_along(county_sets)) {
  outfile <- sprintf("%s_%d.geojson", state, i)
  st_write(county_sets[[i]], dsn=outfile)
}
set_id_df <- data_frame(year=as.integer(names(set_ids)), county_set=as.integer(unlist(set_ids)))
jsonlite::write_json(set_id_df, 'shpdict.json')

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
  filter(STATE=='AZ') %>%
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

