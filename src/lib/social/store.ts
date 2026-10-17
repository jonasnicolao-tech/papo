import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ME,
  initialData,
  isFriend,
  pair,
  type Community,
  type Person,
  type Poll,
  type Rating,
  type SocialData,
  type Topic,
  type TopicReply,
} from "@/lib/social/model";

export type ProfilePatch = Partial<
  Pick<Person, "name" | "city" | "uf" | "status" | "about" | "phrase" | "job" | "interests">
>;

type Actions = {
  postScrap: (toId: string, text: string, replyTo?: string) => void;
  removeScrap: (id: string) => void;
  writeTestimonial: (toId: string, text: string) => void;
  removeTestimonial: (id: string) => void;
  addFriend: (id: string) => void;
  removeFriend: (id: string) => void;
  declineRequest: (fromId: string) => void;
  toggleFan: (ofId: string) => void;
  rate: (toId: string, key: "trust" | "cool" | "sexy", value: number) => void;
  recordVisit: (profileId: string) => void;
  updateMe: (patch: ProfilePatch) => void;
  setMyPhoto: (src: string) => void;
  addMyPhoto: (src: string, caption: string) => void;
  removeMyPhoto: (id: string) => void;
  joinCommunity: (id: string) => void;
  leaveCommunity: (id: string) => void;
  createCommunity: (input: { name: string; description: string; category: string }) => string | null;
  postTopic: (communityId: string, title: string, body: string) => void;
  postReply: (topicId: string, body: string) => void;
  vote: (pollId: string, optionId: string) => void;
  sendMessage: (toId: string, text: string) => void;
  markThreadRead: (otherId: string) => void;
  reset: () => void;
};

const memory = new Map<string, string>();
const safeStorage = {
  getItem: (key: string) => (typeof window === "undefined" ? (memory.get(key) ?? null) : localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") memory.set(key, value);
    else localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") memory.delete(key);
    else localStorage.removeItem(key);
  },
};

function nid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useSocial = create<SocialData & Actions>()(
  persist(
    (set) => ({
      ...initialData(),
      postScrap: (toId, text, replyTo) =>
        set((s) => {
          const body = text.trim().slice(0, 500);
          if (!body || !s.people.some((p) => p.id === toId)) return s;
          return {
            scraps: [{ id: nid(), fromId: ME, toId, text: body, at: Date.now(), replyTo }, ...s.scraps].slice(0, 400),
          };
        }),
      removeScrap: (id) =>
        set((s) => ({
          scraps: s.scraps.filter((x) => {
            if (x.id !== id) return true;
            return x.fromId !== ME && x.toId !== ME;
          }),
        })),
      writeTestimonial: (toId, text) =>
        set((s) => {
          const body = text.trim().slice(0, 600);
          if (!body || toId === ME || !isFriend(s.friends, ME, toId)) return s;
          const rest = s.testimonials.filter((t) => !(t.fromId === ME && t.toId === toId));
          return { testimonials: [{ id: nid(), fromId: ME, toId, text: body, at: Date.now() }, ...rest] };
        }),
      removeTestimonial: (id) =>
        set((s) => ({
          testimonials: s.testimonials.filter((t) => {
            if (t.id !== id) return true;
            return t.fromId !== ME && t.toId !== ME;
          }),
        })),
      addFriend: (id) =>
        set((s) => {
          if (id === ME || !s.people.some((p) => p.id === id)) return s;
          const key = pair(ME, id);
          return {
            friends: s.friends.includes(key) ? s.friends : [...s.friends, key],
            requests: s.requests.filter((r) => !(r.fromId === id && r.toId === ME)),
          };
        }),
      removeFriend: (id) =>
        set((s) => ({
          friends: s.friends.filter((item) => item !== pair(ME, id)),
        })),
      declineRequest: (fromId) =>
        set((s) => ({
          requests: s.requests.filter((r) => !(r.fromId === fromId && r.toId === ME)),
        })),
      toggleFan: (ofId) =>
        set((s) => {
          if (ofId === ME) return s;
          const exists = s.fans.some((f) => f.fanId === ME && f.ofId === ofId);
          return {
            fans: exists ? s.fans.filter((f) => !(f.fanId === ME && f.ofId === ofId)) : [...s.fans, { fanId: ME, ofId }],
          };
        }),
      rate: (toId, key, value) =>
        set((s) => {
          if (toId === ME) return s;
          const nextValue = value < 0 || value > 3 ? 0 : value;
          const idx = s.ratings.findIndex((r) => r.fromId === ME && r.toId === toId);
          if (idx === -1) {
            const blank: Rating = { fromId: ME, toId, trust: 0, cool: 0, sexy: 0, [key]: nextValue };
            return { ratings: [...s.ratings, blank] };
          }
          const ratings = s.ratings.slice();
          ratings[idx] = { ...ratings[idx], [key]: nextValue };
          return { ratings };
        }),
      recordVisit: (profileId) =>
        set((s) => {
          if (profileId === ME || !s.people.some((p) => p.id === profileId)) return s;
          const visits = [
            { visitorId: ME, profileId, at: Date.now() },
            ...s.visits.filter((v) => !(v.visitorId === ME && v.profileId === profileId)),
          ].slice(0, 60);
          return { visits };
        }),
      updateMe: (patch) =>
        set((s) => ({
          people: s.people.map((p) => (p.id === ME ? { ...p, ...patch } : p)),
        })),
      setMyPhoto: (src) =>
        set((s) => ({
          people: s.people.map((p) => (p.id === ME ? { ...p, photo: src } : p)),
        })),
      addMyPhoto: (src, caption) =>
        set((s) => {
          if (s.photos.filter((p) => p.ownerId === ME).length >= 12) return s;
          return {
            photos: [
              { id: nid(), ownerId: ME, src, caption: caption.trim().slice(0, 80) || "foto nova" },
              ...s.photos,
            ],
          };
        }),
      removeMyPhoto: (id) =>
        set((s) => ({
          photos: s.photos.filter((p) => !(p.id === id && p.ownerId === ME)),
        })),
      joinCommunity: (id) =>
        set((s) => ({
          communities: s.communities.map((c) =>
            c.id === id && !c.memberIds.includes(ME)
              ? { ...c, memberIds: [...c.memberIds, ME], listed: c.listed + 1 }
              : c,
          ),
        })),
      leaveCommunity: (id) =>
        set((s) => ({
          communities: s.communities.map((c) =>
            c.id === id && c.memberIds.includes(ME)
              ? { ...c, memberIds: c.memberIds.filter((m) => m !== ME), listed: Math.max(1, c.listed - 1) }
              : c,
          ),
        })),
      createCommunity: (input) => {
        const name = input.name.trim().slice(0, 60);
        const description = input.description.trim().slice(0, 280);
        if (!name || !description) return null;
        const id = nid();
        const community: Community = {
          id,
          name,
          description,
          category: input.category,
          ownerId: ME,
          memberIds: [ME],
          listed: 1,
          accent: "rose",
        };
        set((s) => ({ communities: [community, ...s.communities] }));
        return id;
      },
      postTopic: (communityId, title, body) =>
        set((s) => {
          const community = s.communities.find((c) => c.id === communityId);
          const head = title.trim().slice(0, 80);
          const text = body.trim().slice(0, 800);
          if (!community || !community.memberIds.includes(ME) || !head || !text) return s;
          const topic: Topic = { id: nid(), communityId, authorId: ME, title: head, body: text, at: Date.now() };
          return { topics: [topic, ...s.topics] };
        }),
      postReply: (topicId, body) =>
        set((s) => {
          const topic = s.topics.find((t) => t.id === topicId);
          const community = s.communities.find((c) => c.id === topic?.communityId);
          const text = body.trim().slice(0, 800);
          if (!topic || !community?.memberIds.includes(ME) || !text) return s;
          const reply: TopicReply = { id: nid(), topicId, authorId: ME, body: text, at: Date.now() };
          return { replies: [...s.replies, reply] };
        }),
      vote: (pollId, optionId) =>
        set((s) => ({
          polls: s.polls.map((poll) => {
            if (poll.id !== pollId) return poll;
            const community = s.communities.find((c) => c.id === poll.communityId);
            if (!community?.memberIds.includes(ME)) return poll;
            return shiftVote(poll, optionId);
          }),
        })),
      sendMessage: (toId, text) =>
        set((s) => {
          const body = text.trim().slice(0, 500);
          if (!body || !isFriend(s.friends, ME, toId)) return s;
          return {
            messages: [...s.messages, { id: nid(), fromId: ME, toId, text: body, at: Date.now(), read: true }],
          };
        }),
      markThreadRead: (otherId) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.toId === ME && m.fromId === otherId ? { ...m, read: true } : m)),
        })),
      reset: () => set(initialData()),
    }),
    {
      name: "recadario-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        people: s.people,
        photos: s.photos,
        scraps: s.scraps,
        testimonials: s.testimonials,
        communities: s.communities,
        topics: s.topics,
        replies: s.replies,
        polls: s.polls,
        messages: s.messages,
        ratings: s.ratings,
        visits: s.visits,
        friends: s.friends,
        requests: s.requests,
        fans: s.fans,
      }),
    },
  ),
);

function shiftVote(poll: Poll, optionId: string): Poll {
  const already = poll.options.some((o) => o.id === optionId && o.voterIds.includes(ME));
  return {
    ...poll,
    options: poll.options.map((o) => {
      const without = o.voterIds.filter((id) => id !== ME);
      if (o.id !== optionId || already) return { ...o, voterIds: without };
      return { ...o, voterIds: [...without, ME] };
    }),
  };
}
