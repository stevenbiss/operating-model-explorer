// The published schemas (schema/*.schema.json) are the single source of truth for header rules.
import model from '../../schema/model.schema.json' with { type: 'json' };
import party from '../../schema/party.schema.json' with { type: 'json' };
import team from '../../schema/team.schema.json' with { type: 'json' };
import role from '../../schema/role.schema.json' with { type: 'json' };
import persona from '../../schema/persona.schema.json' with { type: 'json' };
import workstream from '../../schema/workstream.schema.json' with { type: 'json' };
import processSchema from '../../schema/process.schema.json' with { type: 'json' };
import structure from '../../schema/structure.schema.json' with { type: 'json' };
import theme from '../../schema/theme.schema.json' with { type: 'json' };
import brand from '../../schema/brand.schema.json' with { type: 'json' };

export const schemas = { model, party, team, role, persona, workstream, process: processSchema, structure, theme };
// A brand pack is not an element: it is read only from brands/<id>/brand.md, so it has no "type" (design D2).
export const brandSchema = brand;
