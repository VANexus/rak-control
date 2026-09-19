/** 运行时上下文：登录后由 store 注入当前 clubId（避免 store↔service 循环依赖） */
let clubId: string | null = null

export function setClubId(id: string | null) {
  clubId = id
}

export function currentClubId(): string {
  if (!clubId) {
    throw new Error('clubId 未初始化（需先完成登录）')
  }
  return clubId
}
