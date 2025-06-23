import { validate } from 'class-validator';
import { CreateDocumentDto } from '../create-document.dto';

describe('CreateDocumentDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateDocumentDto();
    dto.filename = 'file.txt';
    dto.mimetype = 'text/plain';
    dto.size = 123;
    dto.path = '/uploads/file.txt';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if required fields are missing', async () => {
    const dto = new CreateDocumentDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const props = errors.map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['filename', 'mimetype', 'size', 'path']));
  });
});