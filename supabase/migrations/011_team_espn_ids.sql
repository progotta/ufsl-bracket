-- Add espn_id column to teams table for ESPN CDN logo integration
-- ESPN logo URL pattern: https://a.espncdn.com/i/teamlogos/ncaa/500/{espn_id}.png

alter table teams add column if not exists espn_id integer;

-- Populate known ESPN IDs for common NCAA tournament teams
-- These map to ESPN's internal team identifiers used in their CDN
update teams set espn_id = 333 where lower(name) = 'alabama';
update teams set espn_id = 12 where lower(name) = 'arizona';
update teams set espn_id = 9 where lower(name) = 'arizona state';
update teams set espn_id = 8 where lower(name) = 'arkansas';
update teams set espn_id = 2 where lower(name) = 'auburn';
update teams set espn_id = 239 where lower(name) = 'baylor';
update teams set espn_id = 232 where lower(name) = 'charleston';
update teams set espn_id = 156 where lower(name) = 'creighton';
update teams set espn_id = 150 where lower(name) = 'duke';
update teams set espn_id = 2181 where lower(name) = 'drake';
update teams set espn_id = 57 where lower(name) = 'florida';
update teams set espn_id = 2229 where lower(name) = 'florida atlantic';
update teams set espn_id = 231 where lower(name) = 'furman';
update teams set espn_id = 2250 where lower(name) = 'gonzaga';
update teams set espn_id = 2253 where lower(name) = 'grand canyon';
update teams set espn_id = 47 where lower(name) = 'howard';
update teams set espn_id = 248 where lower(name) = 'houston';
update teams set espn_id = 356 where lower(name) = 'illinois';
update teams set espn_id = 84 where lower(name) = 'indiana';
update teams set espn_id = 314 where lower(name) = 'iona';
update teams set espn_id = 2294 where lower(name) = 'iowa';
update teams set espn_id = 66 where lower(name) = 'iowa state';
update teams set espn_id = 2305 where lower(name) = 'kansas';
update teams set espn_id = 338584 where lower(name) like 'kennesaw%';
update teams set espn_id = 2309 where lower(name) = 'kent state';
update teams set espn_id = 96 where lower(name) = 'kentucky';
update teams set espn_id = 309 where lower(name) = 'louisiana';
update teams set espn_id = 269 where lower(name) = 'marquette';
update teams set espn_id = 120 where lower(name) = 'maryland';
update teams set espn_id = 235 where lower(name) = 'memphis';
update teams set espn_id = 2390 where lower(name) = 'miami';
update teams set espn_id = 127 where lower(name) = 'michigan state';
update teams set espn_id = 142 where lower(name) = 'missouri';
update teams set espn_id = 149 where lower(name) = 'montana state';
update teams set espn_id = 94 where lower(name) like 'n. kentucky%' or lower(name) like 'northern kentucky%';
update teams set espn_id = 152 where lower(name) = 'nc state';
update teams set espn_id = 153 where lower(name) = 'north carolina';
update teams set espn_id = 198 where lower(name) = 'oral roberts';
update teams set espn_id = 213 where lower(name) = 'penn state';
update teams set espn_id = 221 where lower(name) = 'pittsburgh';
update teams set espn_id = 163 where lower(name) = 'princeton';
update teams set espn_id = 2507 where lower(name) = 'providence';
update teams set espn_id = 2509 where lower(name) = 'purdue';
update teams set espn_id = 21 where lower(name) like 'san diego st%';
update teams set espn_id = 2546 where lower(name) like 'se missouri%';
update teams set espn_id = 245 where lower(name) = 'texas a&m';
update teams set espn_id = 2628 where lower(name) = 'tcu';
update teams set espn_id = 2633 where lower(name) = 'tennessee';
update teams set espn_id = 251 where lower(name) = 'texas';
update teams set espn_id = 2640 where lower(name) = 'texas southern';
update teams set espn_id = 2540 where lower(name) like 'uc santa barbara%';
update teams set espn_id = 26 where lower(name) = 'ucla';
update teams set espn_id = 2427 where lower(name) like 'unc asheville%';
update teams set espn_id = 254 where lower(name) = 'utah';
update teams set espn_id = 328 where lower(name) = 'utah state';
update teams set espn_id = 2670 where lower(name) = 'vcu';
update teams set espn_id = 261 where lower(name) = 'vermont';
update teams set espn_id = 258 where lower(name) = 'virginia';
update teams set espn_id = 277 where lower(name) = 'west virginia';
update teams set espn_id = 2752 where lower(name) = 'xavier';
update teams set espn_id = 333 where lower(name) = 'alabama';

-- Also populate logo_url from ESPN CDN for teams that have espn_id
update teams set logo_url = 'https://a.espncdn.com/i/teamlogos/ncaa/500/' || espn_id || '.png'
  where espn_id is not null and (logo_url is null or logo_url = '');

-- Create index for espn_id lookups
create index if not exists idx_teams_espn_id on teams(espn_id) where espn_id is not null;
