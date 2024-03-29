import request from 'supertest';
import RentalModel from '@models/RentalModel';
import { Rental } from '@interfaces/Rental';
import factory from '../utils/RentalFactory';
import MongoDatabase from '../../src/infra/mongo/index';
import app from '../../src/app';

const PREFIX = '/api/v1/rental';
const rentalData = {
  nome: 'Localiza Rent a Car',
  cnpj: '16.670.085/0001-55',
  atividades: 'Aluguel de Carros E Gestão de Frotas',
  endereco: [
    {
      cep: '96200-200',
      number: '1234',
      isFilial: false,
    },
    {
      cep: '96200-500',
      number: '5678',
      complemento: 'Muro A',
      isFilial: true,
    },
  ],
};
describe('src :: api :: controllers :: rental', () => {
  beforeAll(async () => {
    await RentalModel.deleteMany();
  });
  afterAll(async () => {
    await MongoDatabase.disconect();
  });
  afterEach(async () => {
    await RentalModel.deleteMany();
  });

  /**
   * POST /rental
   */

  it('Should create a rental place and return 201 with database content', async () => {
    const response = await request(app).post(PREFIX).send(rentalData);

    const { body } = response;

    expect(response.status).toBe(201);

    expect(body).toHaveProperty('_id');
    expect(body).not.toHaveProperty('__v');
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('cnpj');
    expect(body).toHaveProperty('atividades');
    expect(body).toHaveProperty('endereco');
    expect(body.endereco.length).toEqual(rentalData.endereco.length);
    expect(body.nome).toBe(rentalData.nome);
    expect(body.cnpj).toBe(rentalData.cnpj);
    expect(body.atividades).toBe(rentalData.atividades);
    body.endereco.forEach((endereco, index) => {
      expect(endereco).toHaveProperty('cep');
      expect(endereco).toHaveProperty('number');
      expect(endereco).toHaveProperty('isFilial');
      expect(endereco).toHaveProperty('logradouro');
      expect(endereco).toHaveProperty('bairro');
      expect(endereco).toHaveProperty('localidade');
      expect(endereco).toHaveProperty('uf');
      expect(endereco.cep).toBe(rentalData.endereco[index].cep);
      expect(endereco.number).toBe(rentalData.endereco[index].number);
      expect(endereco.isFilial).toBe(rentalData.endereco[index].isFilial);
    });
  });

  it('should return 400 with errors if missing an attribute on create rental', async () => {
    const rentalTemp = {
      cnpj: '16.670.085/0001-57',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('nome');
    expect(body[0].name).toBe('"nome" is required');
  });

  it('should return 400 with errors if white space entry on create rental', async () => {
    const rentalTemp = {
      nome: '   ',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('nome');
    expect(body[0].name).toBe('"nome" is not allowed to be empty');
  });

  it('should return 400 with errors if endereco has not any child on create rental', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('endereco');
    expect(body[0].name).toBe('"endereco" must contain at least 1 items');
  });

  it('should return 400 with errors if endereco has more than one headquarters on create rental', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: false,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('invalid');
    expect(body[0].name).toBe('isFilial has more than one headquarters');
  });

  it('should return 400 with errors if CNPJ already exists on create rental', async () => {
    const rentalAuto = await factory.create<Rental>('Rental', {
      cnpj: '08.450.508/0001-01',
    });
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: rentalAuto.cnpj,
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('conflict');
    expect(body[0].name).toBe('CNPJ 08.450.508/0001-01 already in use');
  });

  it('should return 400 with errors if CNPJ has invalid format on create rental', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('cnpj');
    expect(body[0].name).toBe('"cnpj" has a invalid format');
  });

  it('should return 400 with errors if CNPJ is invalid calculated value on create rental', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001-78',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('invalid');
    expect(body[0].name).toBe('CNPJ 08.450.508/0001-78 is invalid');
  });

  it('should return 400 with errors if CEP has invalid format on create rental', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001-01',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const response = await request(app).post(PREFIX).send(rentalTemp);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('endereco.0.cep');
    expect(body[0].name).toBe(
      '"cep" with incorrect format, it should be XXXXX-XXX'
    );
  });

  /**
   * GET BY ID
   */

  it('should get a rental company by ID', async () => {
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app).get(`${PREFIX}/${tempData.id}`);

    const { body } = response;

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('_id');
    expect(body).not.toHaveProperty('__v');
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('cnpj');
    expect(body).toHaveProperty('atividades');
    expect(body).toHaveProperty('endereco');
    expect(body.endereco.length).toEqual(tempData.endereco.length);
    expect(body.nome).toBe(tempData.nome);
    expect(body.cnpj).toBe(tempData.cnpj);
    expect(body.atividades).toBe(tempData.atividades);
    body.endereco.forEach((endereco, index) => {
      expect(endereco).toHaveProperty('cep');
      expect(endereco).toHaveProperty('number');
      expect(endereco).toHaveProperty('isFilial');
      expect(endereco).toHaveProperty('logradouro');
      expect(endereco).toHaveProperty('bairro');
      expect(endereco).toHaveProperty('localidade');
      expect(endereco).toHaveProperty('uf');
      expect(endereco.cep).toBe(tempData.endereco[index].cep);
      expect(endereco.number).toBe(tempData.endereco[index].number);
      expect(endereco.isFilial).toBe(tempData.endereco[index].isFilial);
    });
  });

  it('should return 400 with errors if ID is invalid when searching', async () => {
    const response = await request(app).get(`${PREFIX}/12`);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('id');
    expect(body[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 404 with error if ID is not found when searching', async () => {
    const response = await request(app).get(
      `${PREFIX}/6171508962f47a7a91938d30`
    );
    const { body } = response;

    expect(response.status).toBe(404);
    expect(body.length).toEqual(1);
    expect(body[0].description).toBe('Not Found');
    expect(body[0].name).toBe('Value 6171508962f47a7a91938d30 not found');
  });

  /**
   * DELETE BY ID
   */

  it("should remove a rental company by it's ID", async () => {
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app).delete(`${PREFIX}/${tempData.id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('should return 400 with errors if ID is invalid when removing', async () => {
    const response = await request(app).delete(`${PREFIX}/12`);
    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('id');
    expect(body[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 404 with error if ID is not found when removing', async () => {
    const response = await request(app).delete(
      `${PREFIX}/6171508962f47a7a91938d30`
    );
    const { body } = response;

    expect(response.status).toBe(404);
    expect(body.length).toEqual(1);
    expect(body[0].description).toBe('Not Found');
    expect(body[0].name).toBe('Value 6171508962f47a7a91938d30 not found');
  });

  /**
   * PUT BY ID
   */

  it('Should update a rental place and return 200 with new database content', async () => {
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalData);

    const { body } = response;

    expect(response.status).toBe(200);

    expect(body).toHaveProperty('_id');
    expect(body).not.toHaveProperty('__v');
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('cnpj');
    expect(body).toHaveProperty('atividades');
    expect(body).toHaveProperty('endereco');
    expect(body.endereco.length).toEqual(rentalData.endereco.length);
    expect(body.nome).toBe(rentalData.nome);
    expect(body.cnpj).toBe(rentalData.cnpj);
    expect(body.atividades).toBe(rentalData.atividades);
    body.endereco.forEach((endereco, index) => {
      expect(endereco).toHaveProperty('cep');
      expect(endereco).toHaveProperty('number');
      expect(endereco).toHaveProperty('isFilial');
      expect(endereco).toHaveProperty('logradouro');
      expect(endereco).toHaveProperty('bairro');
      expect(endereco).toHaveProperty('localidade');
      expect(endereco).toHaveProperty('uf');
      expect(endereco.cep).toBe(rentalData.endereco[index].cep);
      expect(endereco.number).toBe(rentalData.endereco[index].number);
      expect(endereco.isFilial).toBe(rentalData.endereco[index].isFilial);
    });
  });

  it('should return 400 with errors if missing an attribute on update rental company', async () => {
    const rentalTemp = {
      cnpj: '16.670.085/0001-57',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('nome');
    expect(body[0].name).toBe('"nome" is required');
  });

  it('should return 400 with errors if white space entry on update rental company', async () => {
    const rentalTemp = {
      nome: '   ',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('nome');
    expect(body[0].name).toBe('"nome" is not allowed to be empty');
  });

  it('should return 400 with errors if endereco has not any child on update rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('endereco');
    expect(body[0].name).toBe('"endereco" must contain at least 1 items');
  });

  it('should return 400 with errors if endereco has more than one headquarters on update rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '16.670.085/0001-55',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: false,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('invalid');
    expect(body[0].name).toBe('isFilial has more than one headquarters');
  });

  it('should return 400 with errors if CNPJ already exists when updating a rental company', async () => {
    const rentalAuto = await factory.create<Rental>('Rental', {
      cnpj: '08.450.508/0001-01',
    });
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: rentalAuto.cnpj,
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('conflict');
    expect(body[0].name).toBe('CNPJ 08.450.508/0001-01 already in use');
  });

  it('should return 400 with errors if CNPJ has invalid format on updating a rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('cnpj');
    expect(body[0].name).toBe('"cnpj" has a invalid format');
  });

  it('should return 400 with errors if CNPJ is invalid calculated value on updating a rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001-78',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('invalid');
    expect(body[0].name).toBe('CNPJ 08.450.508/0001-78 is invalid');
  });

  it('should return 400 with errors if CEP has invalid format on updating a rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001-01',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const tempData = await factory.create<Rental>('Rental');

    const response = await request(app)
      .put(`${PREFIX}/${tempData.id}`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('endereco.0.cep');
    expect(body[0].name).toBe(
      '"cep" with incorrect format, it should be XXXXX-XXX'
    );
  });

  it('should return 400 with errors if ID is invalid when updating a rental company', async () => {
    const response = await request(app).put(`${PREFIX}/12`);

    const { body } = response;

    expect(response.status).toBe(400);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].description).toBe('id');
    expect(body[0].name).toBe('"id" length must be 24 characters long');
  });

  it('should return 404 with error if ID is not found when updating a rental company', async () => {
    const rentalTemp = {
      nome: 'Trevor Rental',
      cnpj: '08.450.508/0001-01',
      atividades: 'Aluguel de Carros E Gestão de Frotas',
      endereco: [
        {
          cep: '96200-200',
          number: '1234',
          isFilial: false,
        },
        {
          cep: '96200-500',
          number: '124',
          isFilial: true,
        },
      ],
    };
    const response = await request(app)
      .put(`${PREFIX}/6171508962f47a7a91938d30`)
      .send(rentalTemp);

    const { body } = response;

    expect(response.status).toBe(404);
    expect(body.length).toEqual(1);
    expect(body[0].description).toBe('Not Found');
    expect(body[0].name).toBe('Value 6171508962f47a7a91938d30 not found');
  });
});
