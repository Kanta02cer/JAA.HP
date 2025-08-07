source "https://rubygems.org"

# GitHub Pages用のgem
gem "github-pages", group: :jekyll_plugins
gem "jekyll-feed", "~> 0.6"
gem "jekyll-seo-tag", "~> 2.0"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.6"
  gem "jekyll-seo-tag", "~> 2.0"
end

# Windows と JRuby の互換性のため
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1"
  gem "tzinfo-data"
end

# パフォーマンス向上のため
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "webrick", "~> 1.7"

# GitHub Pages用の追加設定
gem "jekyll-remote-theme"
gem "jekyll-include-cache"
