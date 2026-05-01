import type { Conversation } from "@/types";

export const DUMMY_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_001",
    participant: {
      id: "user_abc",
      username: "nikekid_cph",
      displayName: "Mikkel H.",
      avatarUrl: null,
      isVerified: true,
    },
    product: {
      id: "001",
      title: "Air Jordan 1 Retro High OG Chicago",
      brand: "Nike",
      price: 4299,
      imageUrl: null,
    },
    messages: [
      { id: "msg_001", senderId: "user_abc", text: "Hej! Er prisen fast på Jordan 1'erne?", createdAt: "2026-04-23T14:10:00Z", messageType: "text" },
      { id: "msg_002", senderId: "user_me",  text: "Hej Mikkel. Ja, prisen er fast, men kan godt kigge på det ved hurtig handel.", createdAt: "2026-04-23T14:35:00Z", messageType: "text" },
      { id: "msg_003", senderId: "user_abc", text: "Fedt. Kan jeg se dem i morgen i København?", createdAt: "2026-04-23T15:00:00Z", messageType: "text" },
      { id: "msg_004", senderId: "user_me",  text: "Det kan vi sagtens arrangere. Sender dig en adresse.", createdAt: "2026-04-23T15:12:00Z", messageType: "text" },
      { id: "msg_005", senderId: "user_abc", text: "Super! Ser frem til det 👍", createdAt: "2026-04-23T15:14:00Z", messageType: "text" },
    ],
    unreadCount: 0,
    updatedAt: "2026-04-23T15:14:00Z",
  },
  {
    id: "conv_002",
    participant: {
      id: "user_ghi",
      username: "supreme_sthlm",
      displayName: "Oscar L.",
      avatarUrl: null,
      isVerified: true,
    },
    product: {
      id: "003",
      title: "Supreme Box Logo Hoodie FW22",
      brand: "Supreme",
      price: 3499,
      imageUrl: null,
    },
    messages: [
      { id: "msg_010", senderId: "user_ghi", text: "Er hoodie'en stadig tilgængelig?", createdAt: "2026-04-22T18:00:00Z", messageType: "text" },
      { id: "msg_011", senderId: "user_me",  text: "Ja! Stadig tilgængelig.", createdAt: "2026-04-22T19:30:00Z", messageType: "text" },
      { id: "msg_012", senderId: "user_ghi", text: "Kan du sende til Sverige? Hvad koster forsendelse?", createdAt: "2026-04-23T09:00:00Z", messageType: "text" },
      { id: "msg_013", senderId: "user_ghi", text: "Og kan du sende verificeringsfotos?", createdAt: "2026-04-23T09:01:00Z", messageType: "text" },
    ],
    unreadCount: 2,
    updatedAt: "2026-04-23T09:01:00Z",
  },
  {
    id: "conv_003",
    participant: {
      id: "user_mno",
      username: "stone_island_dk",
      displayName: "Frederik B.",
      avatarUrl: null,
      isVerified: true,
    },
    product: {
      id: "005",
      title: "Stone Island Ghost Piece Jacket",
      brand: "Stone Island",
      price: 5899,
      imageUrl: null,
    },
    messages: [
      { id: "msg_020", senderId: "user_mno", text: "Fed Ghost Piece! Hvad er årgangen?", createdAt: "2026-04-21T11:00:00Z", messageType: "text" },
      { id: "msg_021", senderId: "user_me",  text: "Det er FW2024 — kan sende billede af etiketten hvis det hjælper.", createdAt: "2026-04-21T11:45:00Z", messageType: "text" },
      { id: "msg_022", senderId: "user_mno", text: "Det ville være super. Tak!", createdAt: "2026-04-21T12:00:00Z", messageType: "text" },
    ],
    unreadCount: 1,
    updatedAt: "2026-04-21T12:00:00Z",
  },
  {
    id: "conv_004",
    participant: {
      id: "user_jkl",
      username: "palace_fan",
      displayName: "Rasmus K.",
      avatarUrl: null,
      isVerified: false,
    },
    product: {
      id: "004",
      title: "Palace Tri-Ferg Tee",
      brand: "Palace",
      price: 699,
      imageUrl: null,
    },
    messages: [
      { id: "msg_030", senderId: "user_jkl", text: "Hej, vil du bytte til en Supreme tee?", createdAt: "2026-04-20T16:00:00Z", messageType: "text" },
      { id: "msg_031", senderId: "user_me",  text: "Nej tak, sælger kun.", createdAt: "2026-04-20T17:00:00Z", messageType: "text" },
    ],
    unreadCount: 0,
    updatedAt: "2026-04-20T17:00:00Z",
  },
];
