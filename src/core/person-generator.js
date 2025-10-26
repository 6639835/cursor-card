/**
 * Person Generator
 * Generates realistic US person information using Faker.js
 */

export class PersonGenerator {
  /**
   * Generate complete person information for US
   * @param {Object} faker - Faker.js instance
   * @returns {Object} Person information
   */
  static generate(faker) {
    // Set locale to English
    faker.locale = 'en';

    const province = faker.address.stateAbbr();
    const city = faker.address.city();

    return {
      fullName: faker.name.findName(),
      country: 'US',
      province: province,
      city: city,
      addressLine2: faker.address.secondaryAddress()
    };
  }

  /**
   * Get state abbreviation from full name
   * @param {string} stateName - Full state name
   * @returns {string} State abbreviation
   */
  static getStateAbbr(stateName) {
    const stateMap = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    return stateMap[stateName] || stateName;
  }
}

