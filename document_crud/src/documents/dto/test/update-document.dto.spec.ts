import { validate } from 'class-validator';
import { UpdateDocumentDto } from '../update-document.dto';

describe('UpdateDocumentDto', () => {
  it('should validate when all fields are present', async () => {
    const dto = new UpdateDocumentDto();
    dto.filename = 'file.txt';
    dto.mimetype = 'text/plain';
    dto.size = 123;
    dto.path = '/uploads/file.txt';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate when only some fields are present', async () => {
    const dto = new UpdateDocumentDto();
    dto.filename = 'file.txt';

    const errors = await validate(dto);
    // Should not error because all fields are optional in UpdateDocumentDto
    expect(errors.length).toBe(0);
  });

    it('should fail validation if a field is present but invalid', async () => {
    const dto = new UpdateDocumentDto();
    // @ts-expect-error
    dto.size = 'not-a-number';
  
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});