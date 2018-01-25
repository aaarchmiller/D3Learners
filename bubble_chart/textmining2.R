library(packcircles)

top_nums <- function(data, nums){
  sorted <- sort(data, index.return = TRUE)$ix
  intop <- rep(2, length.out = length(data))
  intop[tail(sorted, nums)] <- 3
  return(intop)
}

best_worse <- function(data, nums){
  sorted <- sort(data, index.return = TRUE)$ix
  out <- rep(2, length.out = length(data))
  out[tail(sorted, nums)] <- 3
  out[head(sorted, nums)] <- 1
  return(out)
}


set.seed(89)
word_data <- tidy_branch %>% group_by(word) %>% tally() %>% filter(n > 2) %>% mutate(sizes = n/10) %>% select(-n)
d = circleRepelLayout(word_data, xysizecols = c(NA, NA, 2), xlim = c(0,10), ylim = c(0, 5.63), maxiter = 1000) # will use area by default
d$layout <- d$layout %>% mutate(id = word_data$word, font_size = 4.8 * (word_data$sizes) ^ 0.9) %>%
  left_join(word_ratios, by = c('id'='word')) %>%
  mutate(extremes_ds = best_worse(ds_identity, 10),
         extremes_wc = best_worse(wc_identity, 10),
         extremes_dsb = best_worse(dsb_identity, 10),
         top_iidd = ifelse(extremes_ds == extremes_wc & extremes_dsb == extremes_wc & extremes_wc == 2, 3, 2))


plot_data <- circlePlotData(d$layout, npoints = 100, xyr.cols = 1:3, id.col = 4) %>%
  full_join(d$layout %>% select(-x, -y))


web_com = ggplot(data = plot_data) + theme_void() + theme(panel.grid = element_blank(), panel.border = element_blank())+geom_polygon(aes(x, y, group = id, fill = factor(extremes_wc)), show.legend = FALSE) +
  scale_fill_manual(name="extremes_wc", values=c("#d8b365","grey80","#5ab4ac")) +
  scale_x_continuous(expand = c(0.05, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  coord_equal() +
  geom_text(data = d$layout, aes(x, y, label = id), size = d$layout$font_size)

dat_sci = ggplot(data = plot_data) + theme_void() + theme(panel.grid = element_blank(), panel.border = element_blank())+geom_polygon(aes(x, y, group = id, fill = factor(extremes_ds)), show.legend = FALSE) +
  scale_fill_manual(name="extremes_ds", values=c("#d8b365","grey80","#5ab4ac")) +
  scale_x_continuous(expand = c(0.05, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  coord_equal() +
  geom_text(data = d$layout, aes(x, y, label = id), size = d$layout$font_size)

dec_sup = ggplot(data = plot_data) + theme_void() + theme(panel.grid = element_blank(), panel.border = element_blank())+geom_polygon(aes(x, y, group = id, fill = factor(extremes_dsb)), show.legend = FALSE) +
  scale_fill_manual(name="extremes_dsb", values=c("#d8b365","grey80","#5ab4ac")) +
  scale_x_continuous(expand = c(0.05, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  coord_equal() +
  geom_text(data = d$layout, aes(x, y, label = id), size = d$layout$font_size)

iidd = ggplot(data = plot_data) + theme_void() + theme(panel.grid = element_blank(), panel.border = element_blank())+geom_polygon(aes(x, y, group = id, fill = factor(top_iidd)), show.legend = FALSE) +
  scale_fill_manual(name="top_iidd", values=c("grey80","#5ab4ac")) +
  scale_x_continuous(expand = c(0.05, 0)) +
  scale_y_continuous(expand = c(0, 0)) +
  coord_equal() +
  geom_text(data = d$layout, aes(x, y, label = id), size = d$layout$font_size)

ggsave(plot = web_com, "web_com.png", width = 10, height = 5.63)
ggsave(plot = dat_sci, "dat_sci.png", width = 10, height = 5.63)
ggsave(plot = dec_sup, "dec_sup.png", width = 10, height = 5.63)
ggsave(plot = iidd, "iidd.png", width = 10, height = 5.63)
