const bcrypt = require('bcryptjs')
const { hashPassword, verifyPassword } = require('../utils/hash')

describe('Password hashing', () => {
  test('hashPassword produces a hash different from the plain text', async () => {
    const hash = await hashPassword('Patient@123')
    expect(hash).not.toBe('Patient@123')
  })

  test('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('Patient@123')
    const result = await verifyPassword('Patient@123', hash)
    expect(result).toBe(true)
  })

  test('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('Patient@123')
    const result = await verifyPassword('WrongPassword', hash)
    expect(result).toBe(false)
  })
})

describe('Format utilities', () => {
  test('2-hour cancellation window is detected correctly', () => {
    const oneHourFromNow = new Date(Date.now() + 1 * 60 * 60 * 1000)
    const threeHoursFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000)

    const hoursUntilOne   = (oneHourFromNow - Date.now()) / (1000 * 60 * 60)
    const hoursUntilThree = (threeHoursFromNow - Date.now()) / (1000 * 60 * 60)

    expect(hoursUntilOne).toBeLessThan(2)    // should be blocked
    expect(hoursUntilThree).toBeGreaterThan(2) // should be allowed
  })
})