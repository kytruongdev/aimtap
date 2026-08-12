Feature: Authentication
  Sign in from the More menu with a valid account.

  @valid
  Scenario: Log in with a valid account
    Given the login screen is open
    When I log in with the standard account
    Then the account is signed in
