export enum SearchBucket {
  PLAYER = 0,
  STAFF = 1,
  CLUB = 2,
  CONSUMABLE = 3
}

export const searchBucketNames: Record<SearchBucket, string> = {
  [SearchBucket.PLAYER]: "Player",
  [SearchBucket.STAFF]: "Staff",
  [SearchBucket.CLUB]: "Club",
  [SearchBucket.CONSUMABLE]: "Consumable"
};
