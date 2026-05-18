const API =
  'http://localhost:5000';


export async function register({

  name,
  last_name,
  username,
  password,
  email,
  identification,
  blood_type,
  rh,
  phone,
  height,
  role = 'patient'

}) {

  try {

    // -------------------------
    // REQUEST
    // -------------------------

    const response =
      await fetch(

        `${API}/register`,

        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            name,
            last_name,
            username,
            password,
            email,
            identification,
            blood_type,
            rh,
            phone,
            height,
            role

          })

        }

      );

    // -------------------------
    // JSON
    // -------------------------

    const data =
      await response.json();

    // -------------------------
    // ERROR
    // -------------------------

    if (!response.ok) {

      throw new Error(

        data.error ||
        'Register failed'

      );

    }

    // -------------------------
    // SUCCESS
    // -------------------------

    return data;

  } catch (error) {

    console.log(
      'REGISTER ERROR:',
      error
    );

    throw error;

  }

}