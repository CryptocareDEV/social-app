import { api } from "./client"

export const getMyFeedProfiles = () =>
  api("/feed-profiles")

export const setActiveFeedProfile = (id) =>
  api(`/feed-profiles/${id}/activate`, {
    method: "POST",
  })

export const createFeedProfile = (data) =>
  api("/feed-profiles", {
    method: "POST",
    body: JSON.stringify(data),
  })

