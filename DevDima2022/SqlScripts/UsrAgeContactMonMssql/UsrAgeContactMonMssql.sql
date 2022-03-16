IF EXISTS (SELECT * FROM sys.views 
WHERE object_id = OBJECT_ID(N'[dbo].[UsrContactAgeMon]'))
DROP VIEW [dbo].UsrContactAgeMon
GO
CREATE VIEW [dbo].UsrContactAgeMon
AS
select Id as UsrId, Name as UsrName, 
BirthDate as UsrBirthDate,
datediff(month, BirthDate, getdate()) as UsrAgeMon 
from Contact
GO