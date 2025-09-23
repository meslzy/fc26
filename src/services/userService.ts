export class UserService {
  private getUser() {
    return services.User.getUser();
  }

  getUserCoins() {
    return this.getUser().coins.amount;
  }
}
