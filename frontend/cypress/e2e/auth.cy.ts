describe('Đăng nhập người dùng', () => {
  it('đăng nhập thành công với tài khoản hợp lệ', () => {
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');
    expect(email, 'CYPRESS_TEST_USER_EMAIL phải được cấu hình').to.be.a('string');
    expect(password, 'CYPRESS_TEST_USER_PASSWORD phải được cấu hình').to.be.a('string');

    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/auth/signin');
    cy.contains('sẵn sàng khám phá chưa?').should('be.visible');
  });

  it('báo lỗi khi sai mật khẩu', () => {
    cy.visit('/auth/signin');
    cy.get('input[name="email"]').type('nobody@example.com');
    cy.get('input[name="password"]').type('wrong-password');
    cy.get('button[type="submit"]').click();
    cy.contains('Email hoặc mật khẩu không đúng').should('be.visible');
  });
});
