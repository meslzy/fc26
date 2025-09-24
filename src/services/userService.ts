export interface Coins {
  type: string
  amount: number
}

export interface User {
  id: string;
  coins: Coins;
}

export class UserService {
  private getUser(): User {
    return services.User.getUser();
  }

  getUserCoins() {
    return this.getUser().coins.amount;
  }
}
