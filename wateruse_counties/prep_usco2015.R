library(readxl)
library(dplyr)
library(tidyr)

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

wateruse_simple <- wateruse %>%
  filter(STATE=='AZ') %>%
  .[c('COUNTY', 'PS-TOPop', vars_simple$'Column Tag')] %>%
  mutate(COUNTY = sapply(strsplit(COUNTY, ' '), `[[`, 1))

jsonlite::write_json(wateruse_simple, 'wateruse.json')
readr::write_tsv(wateruse_simple, 'wateruse.tsv')
jsonlite::write_json(vars_simple, 'datadict.json')
