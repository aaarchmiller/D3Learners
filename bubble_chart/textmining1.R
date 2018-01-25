library(dplyr)
library(readr)
library(tidytext)
library(stringr)
library(tidyr)
library(ggplot2)
library(jsonlite)

branch_text <- read_csv('IIDD_vision_text.csv')

replace_reg <- "https://t.co/[A-Za-z\\d]+"
unnest_reg <- "([^A-Za-z_\\d#@']|'(?![A-Za-z_\\d#@]))"

tidy_branch <- branch_text %>% 
  filter(!str_detect(text, "^RT")) %>%
  mutate(text = str_replace_all(text, replace_reg, "")) %>%
  unnest_tokens(word, text, token = "regex", pattern = unnest_reg) %>%
  filter(!word %in% c(stop_words$word, "boxes"),
         str_detect(word, "[a-z]"))

# find frequency of ea. word in total all IIDD words
frequency_iidd <- tidy_branch  %>% 
  count(word, sort = TRUE) %>% 
  mutate(total = sum(n)) %>% 
  mutate(freq_iidd = n/total) %>% 
  filter(n >= 4) %>% # filter to keep only words used >= 4 times
  select(-n, -total)

frequency_branch <- tidy_branch  %>% 
  group_by(organization) %>% 
  count(word, sort = TRUE) %>% 
  left_join(tidy_branch %>% 
              group_by(organization) %>% 
              summarise(total = n())) %>%
  mutate(freq = n/total) %>% 
  select(organization, word, freq) %>% 
  spread(organization, freq) %>%
  arrange(`web communication`, `data science`, `decision support`)

frequency_all <- frequency_branch %>% 
  rename(freq_wc = `web communication`,
         freq_ds = `data science`,
         freq_dss = `decision support`) %>% 
  right_join(frequency_iidd) ## only keep words that appeared >= 4 times

# get in correct format for d3:
cnames <- colnames(frequency_all)
cnames_freq <- cnames[grep("freq_", cnames)]
frequency_list <- lapply(cnames_freq, function(col) {
  frequency_all %>% select_("word", col) %>% na.omit()
})
names(frequency_list) <- cnames_freq
 
frequency_list$freq_min <- frequency_all %>% select(-word) %>% min(na.rm = TRUE)
frequency_list$freq_max<- frequency_all %>% select(-word) %>% max(na.rm = TRUE)

write_json(frequency_list, "freq_data2.json", pretty = TRUE)

########### jump to D3

word_ratios <- tidy_branch %>%
  count(word, organization) %>%
  filter(sum(n) >= 10) %>%
  ungroup() %>%
  spread(organization, n, fill = 0) %>%
  mutate_if(is.numeric, funs((. + 1) / sum(. + 1))) %>%
  mutate(wc_ds_LR = log(`web communication` / `data science`)) %>%
  mutate(wc_dsb_LR = log(`web communication` / `decision support`)) %>%
  mutate(ds_dsb_LR = log(`data science` / `decision support`)) %>%
  arrange(desc(ds_dsb_LR))

# *most* data sciencey/decision support/web com words used:
word_ratios <- word_ratios %>% mutate(ds_identity = -wc_ds_LR + ds_dsb_LR,
                                      wc_identity = wc_ds_LR + wc_dsb_LR,
                                      dsb_identity = -wc_ds_LR - ds_dsb_LR,
                                      iidd_identity = wc_ds_LR^2 + wc_dsb_LR^2 + ds_dsb_LR^2) %>% arrange(iidd_identity)


