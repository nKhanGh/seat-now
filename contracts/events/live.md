# SeatNow live events v1

Namespace: `/live`. On every connection or reconnection the client emits `watch` with
`{ "venueSlugs": ["demo-cafe-nguyen-hue"], "parkingSlugs": ["demo-nguyen-hue-parking"] }`.
The server limits each array to 50 slugs. Guests may subscribe to public availability.

Accepted venue snapshots publish `venue.availability.updated.v1`:

```json
{ "eventId": "2f3f3618-6719-45be-a35a-ec18767da1aa", "slug": "demo-cafe-nguyen-hue", "version": 12 }
```

Accepted parking snapshots publish `parking.availability.updated.v1` with the same
shape and a parking facility slug. Events are hints to refetch REST; they do not
contain availability numbers. A client must refetch on reconnect, focus and its
normal polling interval because an event can be missed. `version` is monotonic
per venue or parking facility; clients must not apply an older version.
