const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works: 1 item", function () {
    const result = sqlForPartialUpdate({ firstName: "Aliya" }, { firstName: "first_name" });
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Aliya"],
    });
  });

  test("works: 2 items", function () {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: 32 },
      { firstName: "first_name" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("throws error if no data", function () {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: "first_name" });
    }).toThrow(BadRequestError);
  });
});
