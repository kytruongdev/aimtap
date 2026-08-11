Feature: Cart
  Add a product from the catalog to the cart.

  @cart
  Scenario: Add a product to the cart
    Given the cart is empty
    When I add a product to the cart
    Then the cart shows 1 items

  # Intentional-failure demonstration (@assert-fail): the cart really holds one item, but this scenario
  # asserts two, so it fails on purpose to exercise the failing-step screenshot + failure report path.
  # It is excluded from `make run`; run it on demand with `make run-assert-fail`.
  @assert-fail
  Scenario: The cart count is wrongly expected to be two
    Given the cart is empty
    When I add a product to the cart
    Then the cart shows 2 items
