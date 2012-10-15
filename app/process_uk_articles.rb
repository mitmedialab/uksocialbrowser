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

CSV.foreach(filename, {:headers =>true, :header_converters => :symbol, 
               :converters=> :all, :encoding=>"UTF-8", :col_sep => "\t"}) do |article|
  section = correlations.get_section(paper, article[:section])
  next if section.nil?
  articles[section] = [] if(!articles.has_key? section)
  date = Date.parse(article[:gender]) if paper=="guardian"

  article_hash       =   {"id" => article_id,
                          "date"=>date.to_s, 
                          "week"=>"#{date.year}#{date.cweek}",
                          "gender"=>article[:title],
                          "social"=>article[:bylines]}
                          #"url"=>article[:googleplus].gsub("http://www.guardian.co.uk","")}
                          #"title"=>article[:url]}
  articles[section] << article_hash
  File.open("results/articles/#{paper}/#{article_id}.json", "wb") do |f|
    f.write({"date"=>date.to_s, "gender"=>article[:title], 
             "url"=>article[:googleplus], "title"=>article[:url],
             "facebook"=>article[:social], "twitter"=>article[:facebook],
             "googleplus"=>article[:twitter]}.to_json)
  end
  article_id += 1
end

articles.keys.each do |section|
  File.open("results/#{paper}_#{section}_articles.json", "wb") do |f|
    f.write(articles[section].to_json)
  end
end
