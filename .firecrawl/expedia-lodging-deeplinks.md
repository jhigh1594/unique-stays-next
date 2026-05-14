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

[English](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=en_US) [繁體中文](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=zh_TW) [한국어](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=ko_KR) [Português (Brasil)](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=pt_BR) [Español (España)](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=es_ES) [简体中文](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=zh_CN) [日本語](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks?locale=ja_JP)

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

2. Lodging deeplinks


# [Lodging deeplinks](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks\#lodging-deeplinks)

## [Property launch page](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks\#property-launch-page)

The deeplink URL structure for the property launch page is `https://{TemplateSiteDomain}/go/hotel/launch`.

For example:

`https://www.expedia.com/go/hotel/launch`

## [Property search results page](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks\#property-search-results-page)

Base URL:

- `/go/hotel/search/{searchType}/{startDate}/{endDate}`
- `/go/hotel/search/{searchType}`

| Parameter | Description | Required | Default | Possible values | Notes |
| --- | --- | --- | --- | --- | --- |
| `SearchType` | Search type | Y | Destination | `SearchType=Destination` | `SearchType` should be one of the following:<br> • Destination<br> • Place<br> • Address |
| `Group` | Group | N |  | `Group=12345,12346,12347,12348` | Specifies a property group search. |
| `RegionId` | `RegionId` | N |  | `regionId=178307` | Region ID that the destination resolves to. |
| `CityName` | City name | N | None | `CityName=Seattle` | `CityName` is mandatory for destination search. |
| `PlaceName` | Place name | N | None | `PlaceName=Seattle` | `PlaceName` is mandatory for attraction or airport search. |
| `City` | City | N | None | `City=Seattle` | `City` is mandatory for address search. |
| `Street` | Street | N | None | `Street=Madison st` | `Street` is mandatory for address search. |
| `State` | State | N | None | `State=WA` | `State` is mandatory for address search. |
| `Zipcode` | Zipcode | N | None | `Zipcode=98001` | `Zipcode` is mandatory for address search. |
| `InDate` | Check-in date | N | None | `InDate=2022-11-09` | One date format for all POS: yyyy-mm-dd |
| `OutDate` | Check-out date | N | None | `OutDate=2022-11-20` | One date format for all POS: yyyy-mm-dd. You can search up to 330 days out. |
| `daysInFuture` | Days in future | N | None | `daysInFuture=12` | Used in conjunction with `stayLength` to generate an in and out date in the future. Use instead of `InDate` and `OutDate`. |
| `stayLength` | Stay length | N | None | `stayLength=12` | Used in conjunction with `daysInFuture` to generate an in and out date in the future. Use instead of `InDate` and `OutDate`. |
| `Class` | Class | N | 0 | `Class=0` | • `Class=0` \- Show all<br> • `Class=20` \- 2 stars or more <br> • `Class=30` \- 3 stars or more<br> • `Class=40` \- 4 stars or more<br> • `Class=50` \- 5 stars |
| `ChainName` | Property `ChainName` | N | 1 | `ChainName=Executive` | This is a text search of the property name, which may or may not contain the `chainname`. |
| `ChainId` | Property `ChainId` | N | None | `ChainId=55785513` | This is an integer value. |
| `StartRow` | Index of first property to display in results. | N | none | `ChainId=55785513` |  |
| `SortBy` | `SortBy` | N | 0 | `ChainId=55785513` | • 0 to sort by Expedia picks<br> • 10 to sort by price<br> • 1 to sort by name<br> • 6 to sort by class<br> • 2 to sort by review scores |
| `NumNights` |  | N |  |  |  |
| `NumRoom` | Adult counts sometimes vary by point of sale 1 or 2. | N | 1 |  | Maximum of 8 rooms. |
| `selected` | Pin a selected property to the top of search results. |  | `selected=911767` | Pin the property with ID 911767, the Seattle Marriott Waterfront, to the top of the search results.<br> Can use property ID alone or in combination with `Destination` or `RegionID` parameter. |  |

#### Conditional parameters

| Parameter | Required | Default | Possible values |
| --- | --- | --- | --- |
| `NumAdult-Room{ROOM_INDEX}` | N | `NumAdult-Room1=1` | • Maximum of 8 rooms<br> • Maximum of 14 adults<br> • Maximum of 6 children |
| `NumChild-Room{ROOM_INDEX}` | N | `NumChild-Room1=2` | • Maximum of 8 rooms<br> • Maximum of 14 adults<br> • Maximum of 6 children |
| `Room{ROOM_INDEX}-Child{CHILD_INDEX}Age` | N | `Room1-Child1Age=1` | • Maximum of 8 rooms<br> • Maximum of 14 adults<br> • Maximum of 6 children |

#### Examples

- `https://www.expedia.com/go/hotel/info/533436/2022-11-12/2022-11-21?NumRooms=2&NumNights=2&NumAdult-Room1=1&NumAdult-Room2=2&NumChild-Room1=1&NumChild-Room2=2&Room1-Child1Age=4&Room2-Child1Age=6&Room2-Child2Age=8`
- Property details page for the Arizona Grand Resort: `https://www.expedia.com/go/hotel/info/2774/2022-11-10/2022-11-25`

Did you find this page helpful?

YesNo

How can we improve this content?

Any suggestions?

Submit

Thank you for helping us improve!

[Previous\\
\\
Deeplinks\\
\\
PreviousPrevious Document](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking)

[Next\\
\\
Car deeplinks\\
\\
NextNext Document](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/car-deeplinks)

ON THIS PAGE

[Property launch page](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks#property-launch-page)

[Property search results page](https://developers.expediagroup.com/white-label-travel-platform/traffic-growth/deeplinking/lodging-deeplinks#property-search-results-page)

[Privacy Statement](https://developers.expediagroup.com/white-label-travel-platform/legal/privacy-policy) [Cookie Statement](https://developers.expediagroup.com/white-label-travel-platform/legal/cookie-policy) [Terms of Use](https://developers.expediagroup.com/white-label-travel-platform/legal/terms-of-use)

Expedia, Inc. is not responsible for content on external websites.

© 2026 Expedia, Inc., an Expedia Group company. All rights reserved. Expedia and the Airplane Logo are trademarks or registered trademarks of Expedia, Inc. CST# 2029030-50.