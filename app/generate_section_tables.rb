require 'csv'
require 'json'
require 'date'

class SectionCorrelations
  attr_accessor :correlations
  def initialize
    @correlations={"guardian"=>{}, "dailymail"=>{}, "telegraph"=>{}}
    CSV.foreach("./data/section_correllations.csv", :header_converters=>:symbol) do |correlation|
      if @correlations.has_key? correlation[0] 
         @correlations[correlation[0]][correlation[1]] = correlation[2]
      end
    end
  end
  
  def get_section(paper, section)
    if(@correlations.has_key? paper and @correlations[paper].has_key? section)
      return @correlations[paper][section]
    else
      return nil
    end
  end

end


correlations = SectionCorrelations.new
paper = ARGV[0]
paper_file = "all_#{paper}_articles.tsv"
filename ="data/all_articles/#{paper_file}"

articles = {}

#normal:   paper  section  gender  date  bylines  social  facebook twitter googleplus url title text
#guardian: paper  section  title  gender  date  bylines  social  facebook twitter googleplus url title text

article_id = 0

results = {}

CSV.foreach(filename, {:headers =>true, :header_converters => :symbol, 
               :converters=> :all, :encoding=>"UTF-8", :col_sep => "\t"}) do |article|
  section = correlations.get_section(paper, article[:section])
  next if section.nil?

  if !results.has_key? section
    results[section] = {:male_author_articles=>0, :female_author_articles=>0, 
                        :mixed_author_articles=>0, :unknown_author_articles=>0, 
                        :male_author_shares=>0, :female_author_shares=>0, 
                        :mixed_author_shares=>0, :unknown_author_shares=>0}
  end

  case article[:gender]
    when "M"
      results[section][:male_author_articles]  += 1
      results[section][:male_author_shares]   += article[:social]
    when "F"
      results[section][:female_author_articles]+= 1
      results[section][:female_author_shares]   += article[:social]
    when "B"
      results[section][:mixed_author_articles] += 1
      results[section][:mixed_author_shares]   += article[:social]
    when "X"
      results[section][:unknown_author_articles] += 1
      results[section][:unknown_author_shares]  += article[:social]
  end
  article_id += 1
end

  keys=["total_articles_known_gender", "total_shares_known_gender",
        "female_author_articles", "male_author_articles", "mixed_author_articles", 
        "unknown_author_articles", "female_author_shares", "male_author_shares", 
        "mixed_author_shares", "unknown_author_shares", 
        "female_article_percent", "male_article_percent",
        "mixed_article_percent", "female_social_percent",
        "male_social_percent", "mixed_social_percent"]

json = []
#json << keys

  results.each_key do |section|

    results[section][:total_articles_known_gender] = results[section][:male_author_articles] +
      results[section][:female_author_articles] + results[section][:mixed_author_articles]

    results[section][:total_shares_known_gender] = results[section][:male_author_shares] +
      results[section][:female_author_shares] + results[section][:mixed_author_shares]

    results[section][:female_article_percent] = "%.1f" % 
      (results[section][:female_author_articles].to_f * 100.0/ 
       results[section][:total_articles_known_gender].to_f)

    results[section][:male_article_percent] = "%.1f" % 
      (results[section][:male_author_articles].to_f * 100.0/ 
       results[section][:total_articles_known_gender].to_f)
 
    results[section][:mixed_article_percent] = "%.1f" % 
      (results[section][:mixed_author_articles].to_f * 100.0 / 
       results[section][:total_articles_known_gender].to_f)

    results[section][:female_social_percent] = "%.1f" % 
      (results[section][:female_author_shares].to_f * 100.0 / 
       results[section][:total_shares_known_gender].to_f)

    results[section][:male_social_percent] = "%.1f" % 
      (results[section][:male_author_shares].to_f * 100.0 / 
       results[section][:total_shares_known_gender].to_f)

    results[section][:mixed_social_percent] = "%.1f" % 
      (results[section][:mixed_author_shares].to_f * 100.0 / 
       results[section][:total_shares_known_gender].to_f)

    row = {paper:paper, section:section}.merge(results[section])
    json << row #[paper, section] + keys.collect{|k| results[section][k.to_sym]}
  end
File.open(ARGV[1], "wb"){|f|f.write json.to_json}
