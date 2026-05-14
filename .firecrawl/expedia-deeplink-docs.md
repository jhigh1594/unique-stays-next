![Expedia Group Logo](https://a.travel-assets.com/travel-assets-manager/eg-platform-console/eg-e-logo-dark.svg)

Developer Hub

White Label Travel Platform

Rapid API

Build a custom lodging experience with industry-leading supply and great rates

Integration Central

Integrate your connectivity product on the Vrbo platform

Analytics

Leverage powerful analytics to drive smarter decisions

Travel Redirect API

Enable search and discovery of our travel inventory on your site

Technology Partners Program

Find an Expedia-certified provider to help with your API implementations

Connectivity Hub

Seamlessly connect properties to Expedia Group inventories

All products

Go to the Developer Hub home page

Search

English

[English](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=en_US) [繁體中文](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=zh_TW) [한국어](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=ko_KR) [Português (Brasil)](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=pt_BR) [Español (España)](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=es_ES) [简体中文](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=zh_CN) [日本語](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking?locale=ja_JP)

- [Home](https://developers.expediagroup.com/white-label-travel-platform/)
- [Get started](https://developers.expediagroup.com/white-label-travel-platform/getting-started)
- [Single sign-on](https://developers.expediagroup.com/white-label-travel-platform/SSO)
- [Loyalty](https://developers.expediagroup.com/white-label-travel-platform/loyalty)
- [Traffic growth](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth)
- [Resources](https://developers.expediagroup.com/white-label-travel-platform/resources)

Traffic growth

[Overview](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth)

[Typeahead](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/typeahead)

* * *

Attach modules

[Overview](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods)

[Getting started](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/getting-started)

[Request URL](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/request-url)

[Integration](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/integrate)

[Testing](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/testing)

[Implementation checklist](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/checklist)

[FAQs](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-mods/faq)

* * *

Attach links

[Overview](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-deeplink)

[Getting started](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-deeplink/getting-started)

[Request URL](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/attach-deeplink/request-url)

* * *

CRM data feed

[Overview](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/data-exchange)

[SFTP](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/data-exchange/sftp)

[Portal](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/data-exchange/portal)

* * *

Deeplinks

[Overview](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking)

[Lodging deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks)

[Car deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/car-deeplinks)

[Activities deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/activities-deeplinks)

[Flights deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/flight-deeplinks)

[Package deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/package-deeplinks)

1. DeeplinksTraffic growth

2. Overview


# [Deeplinks](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking\#deeplinks)

For the very latest features and functionality try using the [Expedia Deeplink Builder Tool](https://www.expedia.com/marketing-tools/urlbuilder) to dynamically build a deeplink based on your selected parameters.

Deeplinks give you the flexibility to include pre-selected search parameters for travelers in a single URL.

For example, a simple link will take you to the Expedia homepage.

`http://www.expedia.com/`

Whereas the deeplink below takes you to the property detail page for the Hilton San Francisco Airport Bayfront Hotel and shows you pricing for a 2-night stay in September of 2026 with one room for adult and one child (aged 4) and a second room for 2 adults and 2 children (ages 6 and 8).

`http://www.expedia.com/go/hotel/info/12345/2026-09-01/2026-09-03?NumRooms=2&NumNights=2&NumAdult-Room1=1&NumAdult-Room2=2&NumChild-Room1=1&NumChild-Room2=2&Room1-Child1Age=4&Room2-Child1Age=6&Room2-Child2Age=8`

Deeplinks are particularly useful when a traveler has made multiple choices on one website and needs to be transferred to another site without having to make all the same selections again.

Warning

### Warning

Destinations must align with locales supported by your template sites.

## [General guidelines](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking\#general-guidelines)

#### Changing brand or point of sale

We'll be using `www.expedia.com` in all our examples but you can link to other brands and/or points of sale, just replace the brand and/or POS reference in the example URLs.

For example:

You can change `www.expedia.com` to `www.partnersite.ca` or `www.partnersite.co.uk`

#### Third party tracking tags

If you are signed up with a third party company to track and report on your click and booking traffic, you must include the prefixed partner URL structure in every deeplink originating from your site in order for the tracking partner to be able to identify and track your activity.

#### Using marketing codes for tracking and analytics

If you're using marketing codes for mapping within Google Analytics, then please append `mdpcid=<your.marketing.code.here>` at the end of your deeplinks. This marketing code will be returned to Google Analytics under the variable `marketing_same_session_marketing_code`.

For example:

The examples below will return `your.marketing.code` within the variable `marketing_same_session_marketing_code`. You must include the `mdpcid` in every deeplink you use.

- Lodging: `https://{TemplateSiteDomain}/go/hotel/search/Destination?SearchType=Destination&CityName=Seattle&NumRoom=1&NumAdult1=2&mdpcid=your.marketing.code`
- Flights: `https://www.expedia.com/go/flight/search/Roundtrip/2022-12-27/2023-01-01?load=1&FromAirport=SEA&ToAirport=SFO&FromTime=362&ToTime=362&NumAdult=2&mdpcid=your.marketing.code`
- Activities: `https://www.expedia.com/go/activity/search?location=NYC&startDate=2022-12-21&endDate=2022-12-24&mdpcid=your.marketing.code`
- Car: `https://www.expedia.com/go/car/search/Airport/2022-11-01/2022-11-05?PickUpLoc=sea&DiffDropLoc=0&PickUpTime=11AM&DropTime=11AM&Class=NoPreference&mdpcid=your.marketing.code`
- Package: `https://www.expedia.com/go/package/search/FlightHotel/2023-12-01/2023-12-05?FromAirport=seattle&Destination=dallas&FromTime=8AM&ToTime=3PM&NumRoom=1&NumAdult=2&mdpcid=your.marketing.code`

## [Expedia Group solutions that use deeplinks](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking\#expedia-group-solutions-that-use-deeplinks)

The following integration solutions use deeplinks configured by you.

- Stand-alone deeplinks
- Partner-built widgets

Note: Tracking tags are necessary to track the performance of you placements. Your Expedia representative will provide you with the tracking tag that will be appended to the deeplink URL.

Did you find this page helpful?

YesNo

How can we improve this content?

Any suggestions?

Submit

Thank you for helping us improve!

[Previous\\
\\
Portal\\
\\
PreviousPrevious Document](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/data-exchange/portal)

[Next\\
\\
Lodging deeplinks\\
\\
NextNext Document](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks)

ON THIS PAGE

[General guidelines](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking#general-guidelines)

[Expedia Group solutions that use deeplinks](https://developers.expediagroup.com/white-label-template/traffic-growth/deeplinking#expedia-group-solutions-that-use-deeplinks)

[Privacy Statement](https://developers.expediagroup.com/white-label-travel-platform/legal/privacy-policy) [Cookie Statement](https://developers.expediagroup.com/white-label-travel-platform/legal/cookie-policy) [Terms of Use](https://developers.expediagroup.com/white-label-travel-platform/legal/terms-of-use)

Expedia, Inc. is not responsible for content on external websites.

© 2026 Expedia, Inc., an Expedia Group company. All rights reserved. Expedia and the Airplane Logo are trademarks or registered trademarks of Expedia, Inc. CST# 2029030-50.